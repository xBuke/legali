import { put, del, head } from '@vercel/blob';
import crypto from 'crypto';
import { db } from './db';
import { logActivity } from './activity-logger';

/**
 * Document Storage Utilities with Encryption
 * Handles file upload, encryption, and storage using Vercel Blob
 */

export interface EncryptedDocument {
  fileUrl: string;
  encryptionIv: string;
  encryptionKey: string;
  fileHash: string;
  fileSize: number;
}

export interface DocumentUploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

/**
 * Generate a random encryption key for a document
 */
export function generateDocumentKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a random initialization vector for encryption
 */
export function generateEncryptionIV(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Encrypt file data using AES-256-CBC
 */
export function encryptFile(fileBuffer: Buffer, key: string, iv: string): Buffer {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  cipher.setAutoPadding(true);
  
  let encrypted = cipher.update(fileBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return encrypted;
}

/**
 * Decrypt file data using AES-256-CBC
 */
export function decryptFile(encryptedBuffer: Buffer, key: string, iv: string): Buffer {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  decipher.setAutoPadding(true);
  
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted;
}

/**
 * Calculate SHA-256 hash of file data
 */
export function calculateFileHash(fileBuffer: Buffer): string {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Upload and encrypt a document to Vercel Blob
 */
export async function uploadEncryptedDocument(
  file: File,
  metadata: {
    caseId?: string;
    clientId?: string;
    organizationId: string;
    uploadedById: string;
    title?: string;
    description?: string;
    category?: string;
    tags?: string;
  }
): Promise<DocumentUploadResult> {
  try {
    // Convert File to Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Generate encryption key and IV
    const encryptionKey = generateDocumentKey();
    const encryptionIv = generateEncryptionIV();
    
    // Encrypt the file
    const encryptedBuffer = encryptFile(fileBuffer, encryptionKey, encryptionIv);
    
    // Calculate file hash
    const fileHash = calculateFileHash(fileBuffer);
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const fileExtension = file.name.split('.').pop() || 'bin';
    const fileName = `doc_${timestamp}_${randomId}.${fileExtension}`;
    
    // Upload to Vercel Blob
    const blob = await put(fileName, encryptedBuffer, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false
    });
    
    // Save document metadata to database
    const document = await db.document.create({
      data: {
        fileName: fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: blob.url,
        encryptionIv: encryptionIv,
        encryptionKey: encryptionKey,
        fileHash: fileHash,
        isEncrypted: true,
        title: metadata.title || file.name,
        description: metadata.description,
        category: metadata.category,
        tags: metadata.tags,
        caseId: metadata.caseId,
        clientId: metadata.clientId,
        organizationId: metadata.organizationId,
        uploadedById: metadata.uploadedById
      }
    });
    
    // Log activity
    await logActivity({
      action: 'DOCUMENT_UPLOADED',
      entity: 'Document',
      entityId: document.id,
      userId: metadata.uploadedById,
      organizationId: metadata.organizationId,
      changes: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        encrypted: true
      })
    });
    
    return {
      success: true,
      documentId: document.id
    };
    
  } catch (error) {
    console.error('Error uploading encrypted document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Download and decrypt a document from Vercel Blob
 */
export async function downloadDecryptedDocument(
  documentId: string,
  userId: string,
  organizationId: string
): Promise<{ success: boolean; data?: Buffer; error?: string; mimeType?: string; fileName?: string }> {
  try {
    // Get document from database
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        organizationId: organizationId,
        deletedAt: null
      }
    });
    
    if (!document) {
      return {
        success: false,
        error: 'Dokument nije pronađen'
      };
    }
    
    // Check if document is encrypted
    if (!document.isEncrypted || !document.encryptionKey || !document.encryptionIv) {
      return {
        success: false,
        error: 'Dokument nije šifriran'
      };
    }
    
    // Download encrypted file from Vercel Blob
    const response = await fetch(document.fileUrl);
    if (!response.ok) {
      return {
        success: false,
        error: 'Greška pri preuzimanju datoteke'
      };
    }
    
    const encryptedBuffer = Buffer.from(await response.arrayBuffer());
    
    // Decrypt the file
    const decryptedBuffer = decryptFile(
      encryptedBuffer,
      document.encryptionKey,
      document.encryptionIv
    );
    
    // Verify file integrity
    const calculatedHash = calculateFileHash(decryptedBuffer);
    if (calculatedHash !== document.fileHash) {
      return {
        success: false,
        error: 'Integritet datoteke je kompromitiran'
      };
    }
    
    // Log download activity
    await logActivity({
      action: 'DOCUMENT_DOWNLOADED',
      entity: 'Document',
      entityId: document.id,
      userId: userId,
      organizationId: organizationId,
      changes: JSON.stringify({
        fileName: document.originalName,
        fileSize: document.fileSize
      })
    });
    
    return {
      success: true,
      data: decryptedBuffer,
      mimeType: document.mimeType,
      fileName: document.originalName
    };
    
  } catch (error) {
    console.error('Error downloading decrypted document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a document from Vercel Blob and database
 */
export async function deleteDocument(
  documentId: string,
  userId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get document from database
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        organizationId: organizationId,
        deletedAt: null
      }
    });
    
    if (!document) {
      return {
        success: false,
        error: 'Dokument nije pronađen'
      };
    }
    
    // Delete from Vercel Blob
    try {
      await del(document.fileUrl);
    } catch (error) {
      console.warn('Error deleting from Vercel Blob:', error);
      // Continue with database deletion even if blob deletion fails
    }
    
    // Soft delete from database
    await db.document.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date()
      }
    });
    
    // Log deletion activity
    await logActivity({
      action: 'DOCUMENT_DELETED',
      entity: 'Document',
      entityId: document.id,
      userId: userId,
      organizationId: organizationId,
      changes: JSON.stringify({
        fileName: document.originalName,
        fileSize: document.fileSize
      })
    });
    
    return {
      success: true
    };
    
  } catch (error) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get document metadata without downloading the file
 */
export async function getDocumentMetadata(
  documentId: string,
  organizationId: string
): Promise<{ success: boolean; document?: any; error?: string }> {
  try {
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        organizationId: organizationId,
        deletedAt: null
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true
          }
        }
      }
    });
    
    if (!document) {
      return {
        success: false,
        error: 'Dokument nije pronađen'
      };
    }
    
    // Remove sensitive encryption data from response
    const { encryptionKey, encryptionIv, fileHash, ...safeDocument } = document;
    
    return {
      success: true,
      document: safeDocument
    };
    
  } catch (error) {
    console.error('Error getting document metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Croatian translations for document storage messages
 */
export const documentStorageMessages = {
  upload: {
    success: 'Dokument je uspješno učitán',
    error: 'Greška pri učitavanju dokumenta',
    invalidFile: 'Neispravna datoteka',
    fileTooLarge: 'Datoteka je prevelika',
    encryptionFailed: 'Greška pri šifriranju datoteke'
  },
  download: {
    success: 'Dokument je uspješno preuzet',
    error: 'Greška pri preuzimanju dokumenta',
    notFound: 'Dokument nije pronađen',
    integrityFailed: 'Integritet datoteke je kompromitiran',
    decryptionFailed: 'Greška pri dešifriranju datoteke'
  },
  delete: {
    success: 'Dokument je uspješno obrisan',
    error: 'Greška pri brisanju dokumenta',
    notFound: 'Dokument nije pronađen'
  },
  validation: {
    maxFileSize: 'Maksimalna veličina datoteke je 50MB',
    allowedTypes: 'Dozvoljeni tipovi datoteka: PDF, DOC, DOCX, TXT, JPG, PNG',
    required: 'Datoteka je obavezna'
  }
};


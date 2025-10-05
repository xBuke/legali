const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleTemplates() {
  try {
    // Get the test user
    const testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    if (!testUser) {
      console.log('Test user not found. Please run create-test-user.js first.')
      return
    }

    // Create sample templates
    const templates = [
      {
        name: 'Ugovor o radu',
        description: 'Standardni ugovor o radu za zaposlenike',
        category: 'Ugovori',
        caseType: 'Radno pravo',
        content: `UGOVOR O RADU

Između:
[COMPANY_NAME] (poslodavac)
Adresa: [COMPANY_ADDRESS]
OIB: [COMPANY_OIB]

i

[EMPLOYEE_NAME] (zaposlenik)
Adresa: [EMPLOYEE_ADDRESS]
OIB: [EMPLOYEE_OIB]

Zaključuje se ovaj ugovor o radu pod sljedećim uvjetima:

1. PREDMET UGOVORA
Zaposlenik se obvezuje obavljati rad [JOB_DESCRIPTION] u skladu s ovim ugovorom.

2. RADNO VRIJEME
Radno vrijeme je [WORKING_HOURS] sati tjedno.

3. PLAĆA
Osnovna plaća iznosi [SALARY] EUR mjesečno.

4. TRAJANJE UGOVORA
Ugovor stupa na snagu [START_DATE] i traje do [END_DATE].

5. OTKAZ UGOVORA
Svaka strana može otkazati ugovor uz poštovanje otkaznog roka od [NOTICE_PERIOD] dana.

Datum: [DATE]
Mjesto: [LOCATION]

Poslodavac: _________________    Zaposlenik: _________________`,
        variables: JSON.stringify(['COMPANY_NAME', 'COMPANY_ADDRESS', 'COMPANY_OIB', 'EMPLOYEE_NAME', 'EMPLOYEE_ADDRESS', 'EMPLOYEE_OIB', 'JOB_DESCRIPTION', 'WORKING_HOURS', 'SALARY', 'START_DATE', 'END_DATE', 'NOTICE_PERIOD', 'DATE', 'LOCATION']),
        isPublic: true,
        authorId: testUser.id
      },
      {
        name: 'Tužba za naknadu štete',
        description: 'Tužba za naknadu materijalne i nematerijalne štete',
        category: 'Tužbe',
        caseType: 'Građansko pravo',
        content: `TUŽBA ZA NAKNADU ŠTETE

Tužitelj: [PLAINTIFF_NAME]
Adresa: [PLAINTIFF_ADDRESS]
OIB: [PLAINTIFF_OIB]

Tuženik: [DEFENDANT_NAME]
Adresa: [DEFENDANT_ADDRESS]
OIB: [DEFENDANT_OIB]

PREDMET TUŽBE

Tužitelj traži od tuženika naknadu štete u iznosu od [DAMAGE_AMOUNT] EUR.

ČINJENIČNO STANJE

[DATE_OF_INCIDENT] godine u [LOCATION_OF_INCIDENT] dogodio se [INCIDENT_DESCRIPTION].

Kao posljedica navedenog događaja, tužitelj je pretrpio:
- Materijalnu štetu u iznosu od [MATERIAL_DAMAGE] EUR
- Nematerijalnu štetu u iznosu od [NON_MATERIAL_DAMAGE] EUR

PRAVNI TEMELJ

Tuženik je odgovoran za nastalu štetu na temelju članka [LEGAL_ARTICLE] Zakona o obveznim odnosima.

ZAKLJUČAK

Tužitelj traži da se:
1. Tuženik osudi na plaćanje naknade štete u iznosu od [DAMAGE_AMOUNT] EUR
2. Tuženik osudi na plaćanje sudske naknade
3. Tuženik osudi na plaćanje kamata od dana podnošenja tužbe

Datum: [DATE]
Mjesto: [LOCATION]

Tužitelj: _________________`,
        variables: JSON.stringify(['PLAINTIFF_NAME', 'PLAINTIFF_ADDRESS', 'PLAINTIFF_OIB', 'DEFENDANT_NAME', 'DEFENDANT_ADDRESS', 'DEFENDANT_OIB', 'DAMAGE_AMOUNT', 'DATE_OF_INCIDENT', 'LOCATION_OF_INCIDENT', 'INCIDENT_DESCRIPTION', 'MATERIAL_DAMAGE', 'NON_MATERIAL_DAMAGE', 'LEGAL_ARTICLE', 'DATE', 'LOCATION']),
        isPublic: true,
        authorId: testUser.id
      }
    ]

    // Check if templates already exist
    const existingTemplates = await prisma.documentTemplate.findMany({
      where: {
        authorId: testUser.id,
        name: {
          in: templates.map(t => t.name)
        }
      }
    })

    if (existingTemplates.length > 0) {
      console.log('Sample templates already exist.')
      return
    }

    // Create templates
    for (const template of templates) {
      const createdTemplate = await prisma.documentTemplate.create({
        data: template
      })
      console.log(`Created template: ${createdTemplate.name}`)
    }

    console.log('✅ Sample templates created successfully!')
  } catch (error) {
    console.error('Error creating sample templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleTemplates()

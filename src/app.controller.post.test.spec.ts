import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { CustomerTestingService } from './testing/customer.testing.service'

import { AppModule } from './app.module'
import { AuthTestingService } from './testing/auth.testing.service'
import { DatabaseSchema } from './types/database.types'

describe('App > Controller > Post', () => {
	let app: INestApplication

	let authTestingService: AuthTestingService
	let customerTestingService: CustomerTestingService

	let customerSchema: DatabaseSchema

	let customer: any

	let jwt: string

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
			providers: [AuthTestingService, CustomerTestingService],
			exports: [AuthTestingService, CustomerTestingService],
		}).compile()

		app = moduleRef.createNestApplication()
		await app.listen(process.env.PORT ?? 3000)
		await app.init()

		authTestingService = app.get<AuthTestingService>(AuthTestingService)
		customerTestingService = app.get<CustomerTestingService>(CustomerTestingService)
		customerSchema = await customerTestingService.getSchema()
		jwt = await authTestingService.login()
	})

	describe('Create', () => {
		it('Create One', async function () {
			const result = await request(app.getHttpServer())
				.post(`/Customer/`)
				.send(customerTestingService.mockCustomer())
				.set('Authorization', `Bearer ${jwt}`)
				.expect(201)

			expect(result.body).toBeDefined()
			expect(result.body[customerSchema.primary_key]).toBeDefined()
			expect(result.body.companyName).toBeDefined()
			expect(result.body.contactName).toBeDefined()
			customer = result.body
		})
		it('Create Many', async function () {
			const result = await request(app.getHttpServer())
				.post(`/Customer/`)
				.send([customerTestingService.mockCustomer(), customerTestingService.mockCustomer()])
				.set('Authorization', `Bearer ${jwt}`)
				.expect(201)
			expect(result.body).toBeDefined()
			expect(result.body.total).toBeDefined()
			expect(result.body.total).toEqual(2)
			expect(result.body.errored).toBeDefined()
			expect(result.body.errored).toEqual(0)
			expect(result.body.successful).toBeDefined()
			expect(result.body.successful).toEqual(2)
			expect(result.body.data.length).toBeGreaterThan(0)
			expect(result.body.data[0][customerSchema.primary_key]).toBeDefined()
			expect(result.body.data[0].companyName).toBeDefined()
			expect(result.body.data[1][customerSchema.primary_key]).toBeDefined()
			expect(result.body.data[1].companyName).toBeDefined()
			customer = result.body
		})
	})

	afterAll(async () => {
		await customerTestingService.deleteCustomer(customer.custId)
		await app.close()
	})
})

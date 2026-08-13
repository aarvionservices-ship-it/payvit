/**
 * Wallet Integration Test Suite
 *
 * Covers the missing and extended wallet backend endpoints:
 * - GET /api/v1/wallet/dashboard
 * - Savings Goals CRUD (/api/v1/wallet/goals)
 * - Bills Management & Pay (/api/v1/wallet/bills, /api/v1/wallet/bills/link, /api/v1/wallet/pay)
 * - POST /api/v1/wallet/receive
 * - GET /api/v1/wallet/cards
 * - GET /api/v1/wallet/linked-accounts
 * - GET /api/v1/wallet/statement (month, year, format, category, search)
 */

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const mongoose = require("mongoose");

// Models
const User = require("../src/modules/auth/model/auth.model");
const CustomerProfile = require("../src/modules/user/model/customerProfile.model");
const Wallet = require("../src/modules/wallet/model/wallet.model");
const SavingsGoal = require("../src/modules/wallet/model/savingsGoal.model");
const Bill = require("../src/modules/wallet/model/bill.model");
const Transaction = require("../src/modules/wallet/model/transaction.model");
const BankAccount = require("../src/modules/wallet/model/bankAccount.model");
const Card = require("../src/modules/wallet/model/card.model");

const JWT_SECRET =
    process.env.JWT_ACCESS_SECRET ||
    "345e972cbbab29aa0d9c3b620f1fc6af148277c66cefa11c23d87c848f2ecd2e170a730030622b51494ea0867239aad72a3f8b43a77c95bff6d3e17b8c95217b";

const USER_ID = "200000000000001";
const TEST_EMAIL = "integrationuser@payvit.test";

function makeToken(userId = USER_ID) {
    return jwt.sign({ userId, role: "customer" }, JWT_SECRET, { expiresIn: "1h" });
}

describe("Wallet Integration — Extended Endpoints", () => {
    let token;

    beforeEach(async () => {
        token = makeToken();
        // Clean relevant collections
        await User.deleteMany({ userId: USER_ID });
        await CustomerProfile.deleteMany({ userId: USER_ID });
        await Wallet.deleteMany({ userId: USER_ID });
        await SavingsGoal.deleteMany({ userId: USER_ID });
        await Bill.deleteMany({ userId: USER_ID });
        await Transaction.deleteMany({ $or: [{ fromUserId: USER_ID }, { toUserId: USER_ID }] });
        await BankAccount.deleteMany({ userId: USER_ID });
        await Card.deleteMany({ userId: USER_ID });

        // Seed base user
        await User.create({
            userId: USER_ID,
            name: "Integration Test User",
            email: TEST_EMAIL,
            password: "hashed_password",
            role: "customer",
            isActive: true,
            isProfileComplete: true
        });
        await CustomerProfile.create({ userId: USER_ID });
    });

    describe("GET /api/v1/wallet/dashboard", () => {
        it("returns inactive wallet status if wallet is not created yet", async () => {
            const res = await request(app)
                .get("/api/v1/wallet/dashboard")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.wallet.status).toBe("INACTIVE");
            expect(res.body.data.wallet.balance).toBe(0);
            expect(res.body.data.smartTip).toBeDefined();
        });

        it("returns active wallet summary when wallet exists and is active", async () => {
            await Wallet.create({
                walletId: "WALT_200001",
                userId: USER_ID,
                status: "active",
                kycStatus: "complete",
                balance: 5000,
                isPinSet: true,
                pin: "123456"
            });

            const res = await request(app)
                .get("/api/v1/wallet/dashboard")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.wallet.walletId).toBe("WALT_200001");
            expect(res.body.data.wallet.status).toBe("ACTIVE");
            expect(res.body.data.wallet.balance).toBe(5000);
            expect(Array.isArray(res.body.data.goals)).toBe(true);
            expect(Array.isArray(res.body.data.upcomingBills)).toBe(true);
            expect(Array.isArray(res.body.data.recentTransactions)).toBe(true);
        });
    });

    describe("Savings Goals CRUD (/api/v1/wallet/goals)", () => {
        it("creates, updates, lists, and deletes a savings goal", async () => {
            // 1. Create Goal
            const createRes = await request(app)
                .post("/api/v1/wallet/goals")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    title: "New Laptop",
                    targetAmount: 60000,
                    targetDate: new Date(Date.now() + 30 * 86400000).toISOString()
                });

            expect(createRes.status).toBe(201);
            expect(createRes.body.success).toBe(true);
            expect(createRes.body.data.title).toBe("New Laptop");
            const goalId = createRes.body.data.goalId;

            // 2. Get Goals
            const getRes = await request(app)
                .get("/api/v1/wallet/goals")
                .set("Authorization", `Bearer ${token}`);

            expect(getRes.status).toBe(200);
            expect(getRes.body.data.goals.length).toBe(1);
            expect(getRes.body.data.goals[0].goalId).toBe(goalId);

            // 3. Update Goal
            const updateRes = await request(app)
                .put(`/api/v1/wallet/goals/${goalId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    savedAmount: 15000,
                    title: "Gaming Laptop"
                });

            expect(updateRes.status).toBe(200);
            expect(updateRes.body.data.savedAmount).toBe(15000);
            expect(updateRes.body.data.title).toBe("Gaming Laptop");

            // 4. Delete Goal
            const deleteRes = await request(app)
                .delete(`/api/v1/wallet/goals/${goalId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(deleteRes.status).toBe(200);

            // Verify deletion
            const getAfterRes = await request(app)
                .get("/api/v1/wallet/goals")
                .set("Authorization", `Bearer ${token}`);
            expect(getAfterRes.body.data.goals.length).toBe(0);
        });

        it("returns 400 for invalid target amount or missing title", async () => {
            const res = await request(app)
                .post("/api/v1/wallet/goals")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "", targetAmount: -100 });

            expect(res.status).toBe(400);
        });
    });

    describe("Bills Management & Payment", () => {
        it("links a bill provider, lists bills, and pays bill using wallet", async () => {
            const argon2 = require("argon2");
            const hashedPin = await argon2.hash("123456");

            await Wallet.create({
                walletId: "WALT_BILL_1",
                userId: USER_ID,
                status: "active",
                kycStatus: "complete",
                balance: 2000,
                isPinSet: true,
                walletPin: hashedPin
            });

            // 1. Link Bill
            const linkRes = await request(app)
                .post("/api/v1/wallet/bills/link")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    provider: "Airtel Broadband",
                    category: "INTERNET",
                    amount: 999,
                    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
                    autopay: false
                });

            expect(linkRes.status).toBe(201);
            expect(linkRes.body.success).toBe(true);
            const billId = linkRes.body.data.billId;

            // 2. List Bills
            const listRes = await request(app)
                .get("/api/v1/wallet/bills")
                .set("Authorization", `Bearer ${token}`);

            expect(listRes.status).toBe(200);
            expect(listRes.body.data.bills.length).toBe(1);

            // 3. Pay Bill
            const payRes = await request(app)
                .post("/api/v1/wallet/pay")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    billId,
                    pin: "123456"
                });

            expect(payRes.status).toBe(200);
            expect(payRes.body.success).toBe(true);
            expect(payRes.body.data.newBalance).toBe(1001);

            // Verify bill status updated to PAID
            const billInDb = await Bill.findOne({ billId });
            expect(billInDb.status).toBe("PAID");
        });
    });

    describe("POST /api/v1/wallet/receive", () => {
        it("credits wallet balance on incoming receive request", async () => {
            await Wallet.create({
                walletId: "WALT_REC_1",
                userId: USER_ID,
                status: "active",
                kycStatus: "complete",
                balance: 100
            });

            const res = await request(app)
                .post("/api/v1/wallet/receive")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    amount: 500,
                    senderName: "Alice",
                    description: "Refund"
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.newBalance).toBe(600);

            const wallet = await Wallet.findOne({ userId: USER_ID });
            expect(wallet.balance).toBe(600);
        });
    });

    describe("GET /api/v1/wallet/cards and GET /api/v1/wallet/linked-accounts", () => {
        it("GET /cards returns empty stub array", async () => {
            const res = await request(app)
                .get("/api/v1/wallet/cards")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBe(0);
        });

        it("GET /linked-accounts returns bank accounts and cards list", async () => {
            await BankAccount.create({
                userId: USER_ID,
                accountHolderName: "Integration User",
                accountNumber: "123456789012",
                accountNumberEncrypted: "enc_123456789012",
                accountNumberMasked: "XXXXXX789012",
                ifscCode: "HDFC0001234",
                bankName: "HDFC Bank"
            });

            const res = await request(app)
                .get("/api/v1/wallet/linked-accounts")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.banks)).toBe(true);
            expect(res.body.data.banks.length).toBe(1);
            expect(res.body.data.banks[0].bankName).toBe("HDFC Bank");
        });

        it("POST /linked-accounts and DELETE /linked-accounts/:id links and unlinks a card", async () => {
            const linkRes = await request(app)
                .post("/api/v1/wallet/linked-accounts")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    type: "CARD",
                    provider: "Visa",
                    cardNumber: "4111111111111111",
                    holderName: "Integration User",
                    expiry: "08/29"
                });

            expect(linkRes.status).toBe(201);
            expect(linkRes.body.success).toBe(true);
            const cardId = linkRes.body.data._id || linkRes.body.data.cardId;

            const cardsRes = await request(app)
                .get("/api/v1/wallet/cards")
                .set("Authorization", `Bearer ${token}`);

            expect(cardsRes.status).toBe(200);
            expect(cardsRes.body.data.length).toBe(1);
            expect(cardsRes.body.data[0].provider).toBe("Visa");

            const unlinkRes = await request(app)
                .delete(`/api/v1/wallet/linked-accounts/${cardId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(unlinkRes.status).toBe(200);

            const cardsAfterRes = await request(app)
                .get("/api/v1/wallet/cards")
                .set("Authorization", `Bearer ${token}`);

            expect(cardsAfterRes.body.data.length).toBe(0);
        });
    });

    describe("GET /api/v1/wallet/statement", () => {
        it("supports search, category, and export format query options", async () => {
            await Transaction.create({
                txnId: "TXN_STMT_1",
                toUserId: USER_ID,
                amount: 1500,
                type: "bank_topup",
                status: "success",
                description: "Salary credit via Bank Transfer"
            });

            // Test search filter
            const searchRes = await request(app)
                .get("/api/v1/wallet/statement?search=Salary")
                .set("Authorization", `Bearer ${token}`);

            expect(searchRes.status).toBe(200);
            expect(searchRes.body.data.transactions.length).toBe(1);

            // Test category filter
            const catRes = await request(app)
                .get("/api/v1/wallet/statement?category=ADD_MONEY")
                .set("Authorization", `Bearer ${token}`);

            expect(catRes.status).toBe(200);
            expect(catRes.body.data.transactions.length).toBe(1);

            // Test PDF format export metadata
            const exportRes = await request(app)
                .get("/api/v1/wallet/statement?format=pdf")
                .set("Authorization", `Bearer ${token}`);

            expect(exportRes.status).toBe(200);
            expect(exportRes.body.data.format).toBe("PDF");
        });
    });
});

const argon2 = require("argon2");
const snowflake = require("../../../core/utils/distributedId");
const userRepo = require("../repository/user.repository");
const customerProfileRepo = require("../repository/customerProfile.repository");

const pagination = require("../../../core/utils/pagination");
const filtering = require("../../../core/utils/filtering");
const sorting = require("../../../core/utils/sorting");

class UserService {

    async getProfile(userId) {

        let user = await userRepo.findById(userId);

        if (user) {
            user = user.toJSON();
            
            // Try to find CustomerProfile and merge its data
            const customerProfile = await customerProfileRepo.findByUserId(userId);
            if (customerProfile) {
                // Merge customer-specific fields
                user.dob = customerProfile.dob;
                user.gender = customerProfile.gender;
                user.occupation = customerProfile.occupation;
                user.annualIncome = customerProfile.annualIncome;
                user.panNumber = customerProfile.panNumber;
                user.aadhaarNumber = customerProfile.aadhaarNumber;
                user.addresses = customerProfile.addresses || [];

                if (customerProfile.profileImage && customerProfile.profileImage.data) {
                    user.profileImage = `data:${customerProfile.profileImage.contentType};base64,${Buffer.from(customerProfile.profileImage.data).toString("base64")}`;
                } else if (user.profileImage && user.profileImage.data) {
                    user.profileImage = `data:${user.profileImage.contentType};base64,${Buffer.from(user.profileImage.data).toString("base64")}`;
                } else {
                    user.profileImage = null;
                }
            } else if (user.profileImage && user.profileImage.data) {
                user.profileImage = `data:${user.profileImage.contentType};base64,${Buffer.from(user.profileImage.data).toString("base64")}`;
            } else {
                user.profileImage = null;
            }
            
            delete user.password;
        }

        return user;

    }

    async updateProfile(userId, data) {

        let processedImage = null;
        let imageWasProvided = false;

        if (data.profileImage && typeof data.profileImage === "string" && data.profileImage.startsWith("data:")) {
            const matches = data.profileImage.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                processedImage = {
                    contentType: matches[1],
                    data: Buffer.from(matches[2], "base64")
                };
            }
            data.profileImage = processedImage;
            imageWasProvided = true;
        } else if (data.profileImage === "" || data.profileImage === null) {
            data.profileImage = null;
            imageWasProvided = true;
        }

        if (data.newPassword) {
            const user = await userRepo.findById(userId);
            if (!user) throw new Error("User not found");
            const isValid = await argon2.verify(user.password, data.currentPassword);
            if (!isValid) throw new Error("Invalid current password");
            data.password = await argon2.hash(data.newPassword);
        }
        
        delete data.currentPassword;
        delete data.newPassword;
        delete data.confirmPassword;

        // Separate user fields from customer fields
        const user = await userRepo.findById(userId);
        if (user && user.role === "customer") {
            const customerFields = [
                'dob', 'gender', 'occupation', 'annualIncome', 
                'panNumber', 'aadhaarNumber', 'addresses'
            ];
            
            const customerData = {};
            customerFields.forEach(field => {
                if (data[field] !== undefined) {
                    customerData[field] = data[field];
                    delete data[field]; // Remove from main data so it doesn't clutter user update
                }
            });

            if (imageWasProvided) {
                customerData.profileImage = data.profileImage;
            }

            if (Object.keys(customerData).length > 0) {
                await customerProfileRepo.update(userId, customerData);
            }
        }

        await userRepo.updateUser(userId, data);

        return { message: "Profile updated" };

    }

    async getUsers(query) {

        const { skip, limit, page } = pagination(query);

        const filter = filtering(query);

        // Support name/email search if provided
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: "i" } },
                { email: { $regex: query.search, $options: "i" } },
                { phone: { $regex: query.search, $options: "i" } }
            ];
            delete filter.search;
        }

        const sort = sorting(query);

        const [data, total] = await Promise.all([
            userRepo.findAll(filter, {
                skip,
                limit,
                sort
            }),
            userRepo.countUsers(filter)
        ]);

        return {
            data,
            total,
            page,
            limit
        };

    }

    async createCustomer(data) {

        const hashedPassword = await argon2.hash(data.password);

        const user = await userRepo.createUser({
            userId: snowflake.nextId(),
            name: data.name,
            phone: data.phone,
            email: data.email,
            password: hashedPassword,
            role: "customer"
        });

        return user;

    }

    async deleteUser(userId) {

        await userRepo.softDelete(userId);

        return { message: "User deleted" };

    }

}

module.exports = new UserService();

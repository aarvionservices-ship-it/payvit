const customerProfileRepo = require("../repository/customerProfile.repository");
const authRepo = require("../../auth/repository/auth.repository");

class CustomerProfileService {

    async getProfile(userId) {
        let profile = await customerProfileRepo.findByUserId(userId);
        if (profile) {
            profile = profile.toJSON();
            if (profile.profileImage && profile.profileImage.data) {
                profile.profileImage = `data:${profile.profileImage.contentType};base64,${Buffer.from(profile.profileImage.data).toString("base64")}`;
            } else {
                profile.profileImage = null;
            }
        }
        return profile;
    }

    async updateProfile(userId, profileData) {
        if (profileData.profileImage) {
            const matches = profileData.profileImage.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                profileData.profileImage = {
                    contentType: matches[1],
                    data: Buffer.from(matches[2], "base64")
                };
            } else {
                delete profileData.profileImage;
            }
        } else if (profileData.profileImage === "" || profileData.profileImage === null) {
            profileData.profileImage = null;
        }

        const profile = await customerProfileRepo.update(userId, profileData);
        
        // Update user's completion status
        await authRepo.update(userId, { isProfileComplete: true });

        return profile;
    }

    async saveStep(userId, stepData) {
        // Partial update for multi-step form
        return await customerProfileRepo.update(userId, stepData);
    }

}

module.exports = new CustomerProfileService();


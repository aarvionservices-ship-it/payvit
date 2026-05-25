const auditRepo = require("./audit.repository");

class AuditService {

    async log(action, userId, entity, entityId, metadata, ip) {

        await auditRepo.createLog({
            action,
            userId,
            entity,
            entityId,
            metadata,
            ip
        });

    }

}

module.exports = new AuditService();
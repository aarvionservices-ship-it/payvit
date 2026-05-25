class LeadAssignmentEngine {

    constructor() {
        this.lastAssigned = 0;
    }

    assignLead(employees) {

        if (!employees.length) return null;

        this.lastAssigned =
            (this.lastAssigned + 1) % employees.length;

        return employees[this.lastAssigned];

    }

}

module.exports = new LeadAssignmentEngine();

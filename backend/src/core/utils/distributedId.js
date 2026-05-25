class Snowflake {

    constructor(machineId = 1) {

        this.machineId = machineId;
        this.sequence = 0;
        this.lastTimestamp = -1;

    }

    timestamp() {
        return Date.now();
    }

    nextId() {

        let timestamp = this.timestamp();

        if (timestamp === this.lastTimestamp) {
            this.sequence++;
        } else {
            this.sequence = 0;
        }

        this.lastTimestamp = timestamp;

        return `${timestamp}${this.machineId}${this.sequence}`;
    }

}

module.exports = new Snowflake(1);

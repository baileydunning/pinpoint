import { tables } from "harperdb";

const HighScoresTable = tables.HighScores

export class HighScores extends HighScoresTable {
    static loadAsInstance = false;
    allowRead() {
		return true
	}

    async get() {
        const results = await HighScoresTable.get();
        return {
            statusCode: 200,
            body: results,
        }
    }

    async post(target, data) {

        const record = { ...data, createdAt: new Date().toISOString() };
        
        await HighScoresTable.create(record);
        return {
            statusCode: 201,
            body: record,
        }
    }
}
import { tables } from "harper";

const HighScoresTable = tables.HighScores

export class high_scores extends HighScoresTable {
    allowRead() {
	    return true
	}

    allowCreate() {
        return true
    }
}
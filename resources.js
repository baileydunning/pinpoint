import { tables } from "harper";

const HighScoresTable = tables.HighScores

export class high_scores extends HighScoresTable {
    static loadAsInstance = false;
    static allowRead() {
	    return true
	}

    static allowCreate() {
        return true
    }
}
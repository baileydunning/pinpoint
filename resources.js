import { tables } from "harper";

const HighScoresTable = tables.HighScores

export class high_scores extends HighScoresTable {
    static loadAsInstance = false;
    allowRead() {
	    return true
	}
}
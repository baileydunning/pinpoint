import { tables } from "harper"

export class high_scores extends tables.HighScores {
    allowRead() {
	    return true
	}

    allowCreate() {
        return true
    }
}
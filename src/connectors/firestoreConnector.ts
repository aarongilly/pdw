import { TransactionObject, QueryObject, Entry, Def } from "../DataJournal";
import { CommitResponse, Connector } from "../pdw";

export class FirestoreConnector implements Connector {
    commit(trans: TransactionObject): Promise<CommitResponse> {
        throw new Error("Method not implemented.");
    }
    query(params: QueryObject): Promise<Entry[]> {
        throw new Error("Method not implemented.");
    }
    getDefs(): Def[] {
        throw new Error("Method not implemented.");
    }
    connect(...params: any): Promise<Def[]> {
        throw new Error("Method not implemented.");
    }
    getServiceName(): string {
        return 'Firestore';
    }
}
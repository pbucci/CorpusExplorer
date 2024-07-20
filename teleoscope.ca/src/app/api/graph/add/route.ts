import { validateRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { dbOp } from '@/lib/db';
import { Db, MongoClient, ObjectId } from 'mongodb';
import { Graph } from '@/types/graph';

import send from '@/lib/amqp';
import { insert, newGroup, newNote, newSearch } from '@/lib/schemas';

export async function POST(request: NextRequest) {
    const { user } = await validateRequest();
    if (!user) {
        return NextResponse.json({ message: 'No user signed in.' });
    }

    const req = await request.json();

    const { uid, type, workflow_id, workspace_id, parameters } = req;

    const result = await dbOp(async (client: MongoClient, db: Db) => {
        let ref = null;
        if (type == "Search") {
            const search = newSearch()
            const res = await insert('searches', search);
            ref = res.insertedId
        }
        if (type == "Group") {
            const group = newGroup(workspace_id)
            const res = await insert('groups', group);
            ref = res.insertedId
        }
        if (type == "Note") {
            const note = newNote(workspace_id)
            const res = await insert('notes', note);
            ref = res.insertedId
        }
        const doc: Graph = {
            uid: uid,
            type: type,
            reference: ref,
            workflow: new ObjectId(workflow_id),
            workspace: new ObjectId(workspace_id),
            status: 'Loading...',
            doclists: [],
            parameters: parameters,
            edges: {
                source: [],
                control: [],
                output: []
            }
        };
        const insert_result = await db
            .collection<Graph>('graph')
            .insertOne(doc);

        send('update_nodes', {
            workflow_id: workflow_id,
            workspace_id: workspace_id,
            node_uids: [uid]
        });

        return insert_result;
    });
    return NextResponse.json(result);
}

import tqdm, numpy as np
import matplotlib.pyplot as plt
import utils
import umap
import hdbscan
import matplotlib.pyplot as plt
import logging
from bson.objectid import ObjectId
import gc
import tasks
from sklearn.metrics.pairwise import euclidean_distances

def cluster_by_groups(group_id_strings, session_oid, limit=10000):
    """Cluster documents using user-provided group ids.

    group_id_strings : list(string) where the strings are MongoDB ObjectID format

    session_oid: string OID for session to add clusters to

    """
    # connect to the database
    db = utils.connect()
    
    # Create ObjectIds
    group_ids = [ObjectId(str(id)) for id in group_id_strings]

    # start by getting the groups
    logging.info(f'Getting all groups in {group_ids}.')
    groups = list(db.groups.find({"_id":{"$in" : group_ids}}))

    # default to ordering documents relative to first group's teleoscope
    teleoscope_oid = groups[0]["teleoscope"]
    teleoscope = db.teleoscopes.find_one({"_id": ObjectId(str(teleoscope_oid))})

    # get Teleoscope from GridFS
    logging.info("Getting ordered documents...")
    all_ordered_documents = utils.gridfsDownload(db, "teleoscopes", ObjectId(str(teleoscope["history"][0]["ranked_document_ids"])))
    ordered_documents = all_ordered_documents[0:limit]
    logging.info(f'Documents downloaded. Top document is {ordered_documents[0]} and length is {len(ordered_documents)}')
    limit = min(limit, len(ordered_documents))
    
    # projection includes only fields we want
    projection = {'id': 1, 'textVector': 1}

    # cursor is a generator which means that it yields a new doc one at a time
    logging.info("Getting documents cursor and building document vector and id list...")
    cursor = db.documents.find(
        # query
        {"id":{"$in": [document[0] for document in ordered_documents]}},
        projection=projection,
        # batch size means number of documents at a time taken from MDB, no impact on iteration 
        batch_size=500
    )

    document_ids = []
    document_vectors = []

    # for large datasets, this will take a while. Would be better to find out whether the UMAP fns 
    # can accept generators for lazy calculation 
    for document in tqdm.tqdm(cursor, total=limit):
        document_ids.append(document["id"])
        document_vectors.append(document["textVector"])
        
    logging.info("Appending documents from groups to document vector and id list...")
    
    for group in groups:

        # grab latest history item for each group
        group_document_ids = group["history"][0]["included_documents"]

        # check to see if a document in a group has been added, if not add it
        for id in group_document_ids:
            try:
                document_ids.index(id)

            except:
                document = db.documents.find_one({"id": id}, projection=projection)
                document_ids.append(id)
                vector = np.array(document["textVector"]).reshape((1, 512))
                document_vectors = np.append(document_vectors, vector, axis=0)


    # for garbage collection
    del ordered_documents
    del cursor
    gc.collect()

    logging.info(f'Document vectors np.array has shape {data.shape}.') # e.g., (600000, 512)

    logging.info("Building distance matrix from document vectors array")
    dm = euclidean_distances(document_vectors)

    logging.info(f"Distance matrix has shape {dm.shape}.") # e.g., (10000, 10000) square matrix

    # update distance matrix such that documents in the same group have distance 0
    for group in range(len(groups)):
        docs = groups[group]['history'][0]['included_documents']

        for i in range(len(docs)):
            index_i = document_ids.index(docs[i])

            for j in range(len(docs)):
                index_j = document_ids.index(docs[j])
                dm[index_i, index_j] = 0 


    logging.info("Running UMAP Reduction...")

    fitter = umap.UMAP(verbose=True,
                       low_memory=True,
                       metric="precomputed", # use distance matrix
                       n_components=5, # reduce to 5 dimensions
    ).fit(dm)
    
    embedding = fitter.embedding_

    umap_embeddings = fitter.transform(dm)
    
    logging.info("Clustering with HDBSCAN...")

    hdbscan_labels = hdbscan.HDBSCAN(
        min_cluster_size=10,
    ).fit_predict(umap_embeddings)

    logging.info(f'HDBScan labels are in set {set(hdbscan_labels)}.')

    label_array = np.array(hdbscan_labels)
    clusters = {}
    
    for hdbscan_label in set(hdbscan_labels):
     
        document_indices_scalar = np.where(label_array == hdbscan_label)[0]
        document_indices = [int(i) for i in document_indices_scalar]
        
        documents = []
        for i in document_indices:
            documents.append(document_ids[i])
        
        clusters[hdbscan_label] = documents

        logging.info(f'There are {len(documents)} documents for Machine Cluster {hdbscan_label}.')

        tasks.add_group(
            human=False, 
            session_id=session_oid, 
            color="#8c564b",
            included_documents=documents, 
            label=int(hdbscan_label),
            username="clustering"
        )


if __name__ == "__main__":
    cluster_by_groups(["62db047aaee56b83f2871510"], "62a7ca02d033034450035a91", "632ccbbdde62ba69239f6682")
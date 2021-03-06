__author__ = 'iljichoi'
import gensim
import numpy as np
import os
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, DBSCAN, AffinityPropagation
from sklearn.pipeline import Pipeline
from sklearn.externals import joblib
from Vectorizer import tasks_to_vectors

from base_config import PCA_OPTION

def train_and_save_vector(input_file, output_file):
    line_obj = gensim.models.word2vec.LineSentence(input_file)
    print 'Start to train word2vec model'
    model = gensim.models.Word2Vec(line_obj, size=200, window=5, min_count=2, workers=3)

    if os.path.exists(output_file):
        os.remove(output_file)

    print 'End of training, Start to save....'
    model.save_word2vec_format(output_file, binary=True)

    return model

def decompose_and_cluster(tasks, word2vec, output_file, method='KMeans', option=10):
    """
        You should pass parameter 'method', 'option' as follows
        method = 'DBSCAN' or 'KMeans'
        option = eps or n_clusters
    """
    print 'Get task vector'
    whole_vector = tasks_to_vectors(tasks, word2vec)

    if PCA_OPTION:
        print 'Down dimension...'
        pca = PCA(5)
        whole_vector = pca.fit_transform(whole_vector)
#    print 'PCA Log Likelihood Score : ' + str(pca.score())

    if method=='KMeans':
        print 'Training K-means...'
        cluster = KMeans(n_clusters=option, n_jobs=3, random_state=123)
    elif method=='DBSCAN':
        print 'Training DBSCAN ... '
        cluster = DBSCAN(eps=option, random_state=123)
    elif method=='Affinity':
        print 'Training on Affinity Propagation..'
        cluster = AffinityPropagation(preference=option)

    labels = cluster.fit_predict(whole_vector)

    if PCA_OPTION:
        cluster_clf = Pipeline(steps=[
            ('w2v_200_to_5_PCA', pca), ('clustering', cluster)
        ])
    else:
        cluster_clf = cluster

    if os.path.exists(output_file):
        os.remove(output_file)
    joblib.dump(cluster_clf, output_file, compress=3)
    print 'Complete dumping'

    return cluster_clf, labels

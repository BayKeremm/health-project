docker run --rm -d -p 5984:5984 -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password --name my_couchdb couchdb:3.3.3
sleep 3
python3 server-project.py


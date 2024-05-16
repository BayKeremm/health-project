import datetime
import json

##
## Initialization of the CouchDB server (creation of 1 collection of
## documents named "ehr", if it is not already existing)
##

import CouchDBClient

client = CouchDBClient.CouchDBClient()

# client.reset()   # If you want to clear the entire content of CouchDB

if not 'ehr' in client.listDatabases():
    client.createDatabase('ehr')


client.installView('ehr', 'sleep_schedules', 'by_user_id', '''
function(doc) {
if (doc.type == 'sleep_schedule') {
    emit(doc.user_id, doc);
  }
}
''')

client.installView('ehr', 'sleep_goals', 'by_user_id', '''
function(doc) {
if (doc.type == 'sleep_goal') {
    emit(doc.user_id, doc);
  }
}
''')

client.installView('ehr', 'users', 'by_user_name', '''
function(doc) {
  if (doc.type == 'user') {
    emit(doc.name, doc);
  }
}
''')
# END STRIP


##
## Serving static HTML/JavaScript resources using Flask
##

from flask import Flask, Response, request, redirect, url_for
app = Flask(__name__)

@app.route('/')
def hello():
    return redirect(url_for('get_index'))

@app.route('/index.html', methods=['GET'])
def get_index():
    with open('index.html', 'r') as f:
        return Response(f.read(), mimetype='text/html')

@app.route('/app.js', methods=['GET'])
def get_javascript():
    with open('app.js', 'r') as f:
        return Response(f.read(), mimetype='text/javascript')


##
## REST API to be implemented by the students
##

@app.route('/create-user', methods=['POST'])
def create_user():
    # "request.get_json()" necessitates the client to have set "Content-Type" to "application/json"
    body = json.loads(request.get_data())

    userId = None

    # TODO
    # BEGIN STRIP
    userId = client.addDocument('ehr', {
        # '_id' : 'IMPLICITLY AUTO-GENERATED BY CouchDB',
        'type': 'user',
        'name': body['name'],
    })
    # END STRIP

    return Response(json.dumps({
        'id': userId
    }), mimetype='application/json')


@app.route('/record-sleep', methods=['POST'])
def record_sleep_schedule():
    # "request.get_json()" necessitates the client to have set "Content-Type" to "application/json"
    body = json.loads(request.get_data())

    now = datetime.datetime.now().isoformat()  # Get current time

    # TODO
    # BEGIN STRIP
    client.addDocument('ehr', {
        # '_id' : 'IMPLICITLY AUTO-GENERATED BY CouchDB',
        'type': 'sleep_schedule',
        'user_id': body['id'],
        'sleep_time': body['sleep_time'],
        'wake_up_time': body['wake_up_time'],
        'sleep_date': body['bedtime_date'],
        'recorded_at': now,
    })
    # END STRIP

    return Response('Recorded sleep data', 200)

@app.route('/record-goal', methods=['POST'])
def record_sleep_goal():
    # "request.get_json()" necessitates the client to have set "Content-Type" to "application/json"
    body = json.loads(request.get_data())

    sleep_golas = client.executeView('ehr', 'sleep_goals', 'by_user_id')

    client.addDocument('ehr', {
        # '_id' : 'IMPLICITLY AUTO-GENERATED BY CouchDB',
        'type': 'sleep_goal',
        'user_id': body['id'],
        'sleep_goal_start': body['sleep_goal_start'],
        'sleep_goal_end': body['sleep_goal_end'],
    })


    return Response('Recorded goal data', 200)



@app.route('/users', methods=['GET'])
def list_users():
    result = []

    # TODO
    # BEGIN STRIP
    users = client.executeView('ehr', 'users', 'by_user_name')

    for user in users:
        result.append({
            'id': user['value']['_id'],
            'name': user['value']['name'],
        })
    # END STRIP

    return Response(json.dumps(result), mimetype='application/json')


@app.route('/sleep-schedules', methods=['GET'])
def list_sleep_schedules():
    userId = request.args.get('id')

    result = []

    sleep_schedules = client.executeView('ehr', 'sleep_schedules', 'by_user_id', userId)

    for schedule in sleep_schedules:
        result.append({
            'recorded_at': schedule['value']['recorded_at'],
            'sleep_time': schedule['value']['sleep_time'],
            'wake_up_time': schedule['value']['wake_up_time'],
            'sleep_date': schedule['value']['sleep_date']
        })
    result = sorted(result, key=lambda x: x['sleep_date'])

    return Response(json.dumps(result), mimetype='application/json')


if __name__ == '__main__':
    app.run()

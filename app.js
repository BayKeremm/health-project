var chart = null;
var global_start_goal = null;
var global_end_goal = null;

function check_current_date(date) {
    var todayDate = new Date();
    var dd = todayDate.getDate();
    var mm = todayDate.getMonth() + 1;
    var yyyy = todayDate.getFullYear();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    todayDate = yyyy + '-' + mm + '-' + dd;
    console.log(todayDate);
    console.log(date);
    if (todayDate >= date) return true;
    else return false;
}
async function getSleepGoal() {
    var select = document.getElementById('user-select');
    var id = select.value;
    if (id === '') {
      console.log('No user selected');
      return;
    }
  
    try {
        const response = await axios.get('/get-goal', {
            params: {
                id: id
            },
            responseType: 'json'
        });

        var goal = response.data;
        if (goal) {
            global_end_goal = goal.sleep_goal_end;
            global_start_goal = goal.sleep_goal_start;
            document.getElementById('current-goal').innerText = `Current Sleep Goal: ${goal.sleep_goal_start} - ${goal.sleep_goal_end}`;
        } else {
            document.getElementById('current-goal').innerText = 'No sleep goal set for this user';
        }
    } catch (error) {
        console.error('Error fetching sleep goal:', error);
        // You can display an error message to the user if needed
    }
    refreshSleepSchedules();
}



function checkSleepGoal(sleepTime, wakeUpTime) {
    var withinRange = false;

    if (global_end_goal != null && global_start_goal != null) {
        // Convert sleep time and wake-up time to minutes
        var sleepHour = parseInt(sleepTime.split(':')[0]);
        var sleepMinute = parseInt(sleepTime.split(':')[1]);
        var sleepTimeInMinutes = sleepHour * 60 + sleepMinute;

        var wakeUpHour = parseInt(wakeUpTime.split(':')[0]);
        var wakeUpMinute = parseInt(wakeUpTime.split(':')[1]);
        var wakeUpTimeInMinutes = wakeUpHour * 60 + wakeUpMinute;

        // Convert user sleep goal start time and end time to minutes
        var userSleepGoalStartHour = parseInt(global_start_goal.split(':')[0]);
        var userSleepGoalStartMinute = parseInt(global_start_goal.split(':')[1]);
        var userSleepGoalStartTimeInMinutes = userSleepGoalStartHour * 60 + userSleepGoalStartMinute;

        var userSleepGoalEndHour = parseInt(global_end_goal.split(':')[0]);
        var userSleepGoalEndMinute = parseInt(global_end_goal.split(':')[1]);
        var userSleepGoalEndTimeInMinutes = userSleepGoalEndHour * 60 + userSleepGoalEndMinute;

        // Check if sleep time falls within the range of user's sleep goal
        var c1 = (sleepTimeInMinutes >= userSleepGoalStartTimeInMinutes - 15 && sleepTimeInMinutes <= userSleepGoalStartTimeInMinutes + 15) ;
        var c2 =     (wakeUpTimeInMinutes >= userSleepGoalEndTimeInMinutes - 15 && wakeUpTimeInMinutes <= userSleepGoalEndTimeInMinutes + 15);
        withinRange =c1 && c2;
    }

    return withinRange;
}


function refreshSleepSchedules() {
    var select = document.getElementById('user-select');
    var id = select.value;
    if (id === '') {
        console.log('No user');
        document.getElementById('sleep-schedule-div').style.visibility = 'hidden';
        return;
    }

    document.getElementById('sleep-schedule-div').style.visibility = 'visible';

    axios.get('sleep-schedules', {
            params: {
                id: id
            },
            responseType: 'json'
        })
        .then(function(response) {
            console.log('Received data:', response.data); // Log received data
            var x = [];
            var y = [];
            var sleepTime = [];
            var wakeUpTime = [];
            var colors = [];
            for (var i = 0; i < response.data.length; i++) {
                var diff;
                var sleeptime = response.data[i]["sleep_time"]
                var wakeuptime = response.data[i]["wake_up_time"]

                var a0 = sleeptime.split(':')
                var a1 = wakeuptime.split(':')

                var mins0 = (+a0[0]) * 60 + (+a0[1]);
                var mins1 = (+a1[0]) * 60 + (+a1[1]);
                if (mins0 - mins1 > 0) diff = (24 - mins0 / 60) + mins1 / 60;
                else diff = Math.abs(mins0 - mins1) / 60;
                console.log('diff:', diff);
                console.log('sleep time:', mins0);
                console.log('wakeup time:', mins1);
                x.push(response.data[i]['sleep_date']);
                y.push(diff);
                sleepTime.push(sleeptime);
                wakeUpTime.push(wakeuptime);
                var meetsGoal = checkSleepGoal(sleeptime, wakeuptime);
                colors.push(meetsGoal ? 'rgba(54, 162, 235, 0.5)' : 'rgba(255, 99, 132, 0.5)');
            }
            console.log('X:', x); // Log X data
            console.log('Y:', y); // Log Y data
            chart.data.labels = x;
            chart.data.datasets[0].data = y;
            chart.data.datasets[0].sleepTime = sleepTime; // Storing sleep times with dataset
            chart.data.datasets[0].wakeUpTime = wakeUpTime; // Storing wake up times with dataset
            chart.data.datasets[0].backgroundColor = colors;
            chart.update();
        })
        .catch(function(response) {
            alert('URI /sleep-schedules not properly implemented in Flask');
        });
}
function refreshUsers() {
    axios.get('users', {
      responseType: 'json'
    })
    .then(function(response) {
      var select = document.getElementById('user-select');
  
      // Clear existing options
      select.innerHTML = '';
  
      // Add empty option
      var emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = 'Select a user';
      select.appendChild(emptyOption);
  
      // Add options for each user
      for (var i = 0; i < response.data.length; i++) {
        var id = response.data[i]['id'];
        var name = response.data[i]['name'];
        var option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        select.appendChild(option);
      }
  
    })
    .catch(function(response) {
      alert('URI /users not properly implemented in Flask');
    });
  }



document.addEventListener('DOMContentLoaded', function() {

    chart = new Chart(document.getElementById('sleep-schedule'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Sleep Schedule',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
        },
        options: {
            animation: {
                duration: 0 // Disable animations
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    ticks: {
                        // Rotate the X label
                        maxRotation: 45,
                        minRotation: 45
                    }
                },

                y: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            var sleepTime = context.dataset.sleepTime[context.dataIndex];
                            var wakeUpTime = context.dataset.wakeUpTime[context.dataIndex];
                            return `Sleep Time: ${sleepTime}, Wake-up Time: ${wakeUpTime}`;
                        }
                    }
                }
            }
        }
    });
    refreshUsers();

    document.getElementById('user-select').addEventListener('change', getSleepGoal);
    document.getElementById('user-select').addEventListener('change', refreshSleepSchedules);



    document.getElementById('user-button').addEventListener('click', function() {
        var name = document.getElementById('user-input').value;
        if (name == '') {
            alert('No name was provided');
        } else {
            axios.post('create-user', {
                    name: name
                })
                .then(function(response) {
                    document.getElementById('user-input').value = '';
                    refreshUsers();
                })
                .catch(function(response) {
                    alert('URI /create-user not properly implemented in Flask');
                });
        }
    });


    document.getElementById('export-button').addEventListener('click', function() {
        var select = document.getElementById('user-select');
        var id = select.value;
        if (id === '') {
            alert('No user selected');
            return;
        }

        axios.get('sleep-schedules', {
                params: {
                    id: id
                },
                responseType: 'json'
            })
            .then(function(response) {
                var sleepData = JSON.stringify(response.data);
                var blob = new Blob([sleepData], {
                    type: 'application/json'
                });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'sleep_data.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            })
            .catch(function(response) {
                alert('Error fetching sleep data');
            });
    });

    document.getElementById('sleep-schedule-button').addEventListener('click', function() {
        var sleepTime = document.getElementById('sleep-time-input').value;
        var wakeUpTime = document.getElementById('wake-up-time-input').value;
        var bedtimeDate = document.getElementById('bedtime-date').value;
        if (sleepTime == '' || wakeUpTime == '' || bedtimeDate == '') {
            alert('Please provide both sleep time and wake up time');
        } else if (!check_current_date(bedtimeDate)) alert("Future bedtime date are not allowed");
        else {
            axios.post('record-sleep', {
                    id: document.getElementById('user-select').value,
                    sleep_time: sleepTime,
                    wake_up_time: wakeUpTime,
                    bedtime_date: bedtimeDate
                })
                .then(function(response) {
                    document.getElementById('sleep-time-input').value = '';
                    document.getElementById('wake-up-time-input').value = '';
                    refreshSleepSchedules();
                })
                .catch(function(response) {
                    alert('URI /record-sleep not properly implemented in Flask');
                });
        }
    });

    document.getElementById('save-goal-button').addEventListener('click', function() {
        var goalStart = document.getElementById('goal-start').value;
        var goalEnd = document.getElementById('goal-end').value;

        // Post the sleep goal to the server
        axios.post('record-goal', {
                id: document.getElementById('user-select').value,
                sleep_goal_start: goalStart,
                sleep_goal_end: goalEnd
            })
            .then(function(response) {
                // Handle success
                console.log('Sleep goal saved successfully:', response.data);
                // Update the displayed current goal
                document.getElementById('current-goal').innerText = `Current Sleep Goal: ${goalStart} - ${goalEnd}`;

                // Optionally, clear input fields
                document.getElementById('goal-start').value = '';
                document.getElementById('goal-end').value = '';
                // You can close the modal here if needed
                document.getElementById('goal-modal').style.display = 'none';
            })
            .catch(function(error) {
                // Handle error
                console.error('Error saving sleep goal:', error);
                // You can display an error message to the user if needed
            });
            refreshSleepSchedules();
    });

});

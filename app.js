/**
 * Copyright (c) 2024, Sebastien Jodogne, ICTEAM UCLouvain, Belgium
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 **/
var chart = null;


function check_current_date(date) {
    var todayDate = new Date();
    var dd = todayDate.getDate();
    var mm = todayDate.getMonth() + 1;
    var yyyy = todayDate.getFullYear();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    todayDate = yyyy +'-'+ mm + '-' + dd;
    console.log(todayDate);
    console.log(date);
    if (todayDate >= date) return true;
    else return false;
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
        y.push(diff)
      }
      console.log('X:', x); // Log X data
      console.log('Y:', y); // Log Y data
      chart.data.labels = x;
      chart.data.datasets[0].data = y;
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

      while (select.options.length > 0) {
        select.options.remove(0);
      }

      for (var i = 0; i < response.data.length; i++) {
        var id = response.data[i]['id'];
        var name = response.data[i]['name'];
        select.appendChild(new Option(name, id));
      }
      refreshSleepSchedules();
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
          ticks: {
            // Rotate the X label
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });

  refreshUsers();

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
      var blob = new Blob([sleepData], { type: 'application/json' });
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
});


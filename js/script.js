function start() {
  getData('data.json').then(function(data){
    // draw charts that don't require deduplicated entries from here
    document.getElementById("total").innerHTML += data.length;
    var parsedByTime = parseInstallationsByTime(data, 1000*60*60*24);
    var startDate = new Date(parsedByTime.timeframe[0]).toDateString();
    var endDate = new Date(parsedByTime.timeframe[1]).toDateString();
    document.getElementById("timeFrame").innerHTML += startDate + ' - ' + endDate;
    drawInstallationsByTime(parseInstallationsByTime(data, 1000*60*60*24, true), "machineIDsOverTime");
    drawInstallationsByTime(parsedByTime, "machineIDsOverTimeC");
    return data;
  }, function(e) {
    console.error("Failed to get data", e);
  }).then(function (data) {
    data = removeDuplicates(data);
    document.getElementById("totalUnique").innerHTML += data.length;
    return data;
  }).then(function(data) {
    // draw charts taht require deduplicated entries from here
    var parsedByCountry = parseInstallationsByCountry(data);
    document.getElementById("totalCountries").innerHTML += parsedByCountry.total;
    drawInstallationsByCountry(parsedByCountry, "installationsByCountry");
    drawInstallationsByCountryPie(parsedByCountry, "installationsByCountryPie");
    drawInstallationsByTime(parseInstallationsByTime(data, 1000*60*60*24, true), "uniqueMachineIDsOverTime");
    drawInstallationsByTime(parseInstallationsByTime(data, 1000*60*60*24), "uniqueMachineIDsOverTimeC");
  });
}

// remove log entries with machineIDs that appear more than once
function removeDuplicates(data) {
  var hash = {};
  var test = data;
  data.forEach(function(log, index, arr){
    var current = log.machineID;
    if (hash[current] === true) {
      test.splice(index, 1);
    }
    hash[current] = true;
    });
  return test;
}

function drawInstallationsByCountry(data, id) {
  var ctx = document.getElementById(id);
  var chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Unique IDs',
        data: data.data,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  });
}

function drawInstallationsByCountryPie(data, id) {
  var ctx = document.getElementById(id);
  var pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Unique IDs',
        data: data.data,
        backgroundColor: [
                "#51574A",
                "#447C69",
                "#74C493",
                "#8E8C6D",
                "#E4BF80",
                "#E9D78E",
                "#E2975D",
                "#F19670",
                "#E16552",
                "#C94A53",
                "#BE5168",
                "#A34974",
                "#993767",
                "#65387D",
                "#4E2472", //
                "#9163B6",
                "#E279A3",
                "#E0598B",
                "#7C9FB0",
                "#5698C4",
                "#9ABF88"
            ]
      }]
    }
  });
}

function drawInstallationsByTime(data, id, cumulative) {
  var ctx = document.getElementById(id);
  var chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Machine IDs [day/month]',
        data: data.data,
        fill: false,
        lineTension: 0.1,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
      }]
    }
  });
}

// parse the installations by country and return the data in a
// chartistjs friendly format
function parseInstallationsByCountry(data) {
  var sortCountries = {};
  data.forEach(function(log) {
    if (sortCountries[log.country] === undefined) {
      sortCountries[log.country] = 0;
    }
    sortCountries[log.country]++;
  });
  var sortArray = [];
  for (var i in sortCountries) {
    sortArray.push({
      'country' : i,
      'installations' : sortCountries[i]
    });
  }
  // sort highest to lowest
  sortArray.sort(function(a,b){
    return b.installations - a.installations;
  });
  var total = sortArray.length;
  // keep the top 20 results and combine the rest into other
  var other = 0;
  for (i = 19; i < sortArray.length; i++) {
    other += sortArray[i].installations;
  }
  sortArray.splice(20);
  sortArray.push({
    'country' : 'Other',
    'installations' : other
  });
  // return the data in a format prefered by chartistjs
  var parsed = { labels: [], data: []};
  sortArray.forEach(function(entry) {
    parsed.labels.push(entry.country);
    parsed.data.push(entry.installations);
  });
  parsed.total = total;
  return parsed;
}

function parseInstallationsByTime(data, interval, cumulative) {
  var time = [];
  data.forEach(function(log) {
    time.push(Date.parse(log.date));
  });
  time.sort();
  var timeframe = [Math.min.apply(null, time), Math.max.apply(null, time)];
  var countInstalls = [{
    'date': new Date(time[0]).getDate() + "/" + new Date(time[0]).getMonth(),
    'installations': 0
  }];
  var firstDate = time[0],
      totalInstallations = 0,
      current = 0,
      secondDate = 0;
  for (var i in time) {
    totalInstallations++;
    secondDate = time[i];
    if (Math.abs(secondDate - firstDate) < interval ) {
      countInstalls[current].installations = totalInstallations;
    } else {
      current++;
      firstDate = time[i];
      if (cumulative) {
        totalInstallations = 1;
      }
      countInstalls.push({
        'date': new Date(time[i]).getDate() + "/" + new Date(time[i]).getMonth(),
        'installations': totalInstallations
      });
    }
  }
  var parsed = { labels: [], data: []};
  countInstalls.forEach(function(entry) {
    parsed.labels.push(entry.date);
    parsed.data.push(entry.installations);
  });
  parsed.timeframe = timeframe;
  return parsed;
}

// get logs from the server
function getData(url) {
  return new Promise(function (resolve, reject){
    var req = new XMLHttpRequest();
    req.open('GET', url);
    req.onload = function () {
      if (req.readyState === 4 && req.status === 200 ) {
        resolve(JSON.parse(req.response));
      } else {
        reject(Error(req.statusText));
      }
    };

    req.onerror = function() {
      reject(Error("Network Error"));
    };

    req.send();
  });
}

window.onload = function () { start(); };

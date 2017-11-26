

var blockRange;
var blockData;
var showOutliers = true;
var txType = "SegWit";
var chartType = "SPB";

var yAxisSpB;
var yAxisTxFees;
var yAxisTxSize;
var range;
var isOutlier;

fetch('./data.json').then(function (response) {
  return response.json();
}).then(function (data) {
  blockData = data.sort(function (a, b) { return a.Height - b.Height; });

  var sliced = blockData.slice(blockData.length - 36, blockData.length);

  RenderCharts(sliced);
});

var AxisLabelFont = {
  size: 24
}

var xAxisLabel = {
  value: "Block Height",
  font: AxisLabelFont
}

var xAxis = {
  value: "Height",
  axis: true,
  grid: true,
  label: xAxisLabel
}

var yAxisLabelSpB = {
  value: "Satoshis / Byte",
  font: AxisLabelFont
}

var yAxisLabelTxFees = {
  value: "BTC / Tx",
  font: AxisLabelFont
}

var yAxisLabelTxSize = {
  value: "Tx Size (Bytes)",
  font: AxisLabelFont
}





function outlierRange(someArray) {

  if (someArray.length < 4)
    return someArray;

  let values, q1, q3, iqr, maxValue, minValue, multiple = 3.5;

  values = someArray.slice().sort((a, b) => a - b);//copy array fast and sort

  if ((values.length / 4) % 1 === 0) {//find quartiles
    q1 = 1 / 2 * (values[(values.length / 4)] + values[(values.length / 4) + 1]);
    q3 = 1 / 2 * (values[(values.length * (3 / 4))] + values[(values.length * (3 / 4)) + 1]);
  } else {
    q1 = values[Math.floor(values.length / 4 + 1)];
    q3 = values[Math.ceil(values.length * (3 / 4) + 1)];
  }

  iqr = q3 - q1;
  maxValue = q3 + iqr * multiple;
  minValue = q1 - iqr * multiple;

  return [minValue, maxValue]
}


var visualization;
var legacyData = [];
var segwitData = [];

function RenderCharts(blockData) {
  blockRange = blockData.map(a => a.Height);

  blockData.forEach(block => {

    segwitTxCount = block.SegWitTxData.txCount;

    for (var i = 0; i < segwitTxCount; i++) {
      dataPoint = {
        "Height": block.Height,
        "name": Math.random(),
        "SPB": block.SegWitTxData.satsPerByte_list[i],
        "txFee": block.SegWitTxData.txFees_list[i],
        "txSize": block.SegWitTxData.txSize_list[i]
      };
      segwitData.push(dataPoint);
    }

    legacyTxCount = block.SegWitTxData.txCount;

    for (var i = 0; i < legacyTxCount; i++) {
      dataPoint = {
        "Height": block.Height,
        "name": Math.random(),
        "SPB": block.LegacyTxData.satsPerByte_list[i],
        "txFee": block.LegacyTxData.txFees_list[i],
        "txSize": block.LegacyTxData.txSize_list[i]
      };
      legacyData.push(dataPoint);
    }

  });


  yAxisTxFees = {
    value: "txFee",
    axis: true,
    grid: true,
    label: yAxisLabelTxFees,
    mute: isOutlier
  }
  
  yAxisTxSize = {
    value: "txSize",
    axis: true,
    grid: true,
    label: yAxisLabelTxSize,
    mute: isOutlier
  }


  yAxisSpB = {
    value: "SPB",
    axis: true,
    grid: true,
    label: yAxisLabelSpB,
    mute: isOutlier
  }

  visualization = d3plus.viz()
    .container("#txFees")
    .data(segwitData)
    .type("box")
    .id("name")
    .x(xAxis)
    .y(yAxisSpB)
    //.background("#a9a9a9")
    .format({
      "text": function (text, params) {
        if (text === "usd") {
          return "Trade Value";
        }
        else {
          return d3plus.string.title(text, params);
        }

      },
      "number": function (number, params) {
        var formatted = d3plus.number.format(number, params);

        if (params.key === "Height" || params.key === "SPB") {
          return number;
        }
        else {
          return formatted;
        }
      }
    })
    .draw()

}

function setRange(txType, chartType) {

  console.log("Setting range...");
  console.log("tx Type: " + txType);
  console.log("Chart Type: " + chartType);
  console.log("Show Outliers? " + showOutliers);

  var data;

  switch (txType) {
    case "Legacy":
      data = legacyData;
      break;
    case "SegWit":
      data = segwitData;
      break;
    default:
      break;
  }

  switch (chartType) {
    case "SPB":
      range = outlierRange(data.map(d => d.SPB))
      break;
    case "txFee":
      range = outlierRange(data.map(d => d.txFee))
      break;
    case "txSize":
      range = outlierRange(data.map(d => d.txSize))
      break;
    default:
      break;

  }

  isOutlier = val => (val > range[1]);

  yAxisSpB["mute"] = showOutliers ? [] : isOutlier;
  yAxisTxFees["mute"] = showOutliers ? [] : isOutlier;
  yAxisTxSize["mute"] = showOutliers ? [] : isOutlier;
}

function showSegwitData() {

  txType = "SegWit";

  setRange(txType, chartType);

  visualization
    .data(segwitData)
    .draw();
}

function showLegacyData() {

  txType = "Legacy";

  setRange(txType, chartType);

  visualization
    .data(legacyData)
    .draw();
}

function showTxFees() {

  chartType = "txFee";

  setRange(txType, chartType);

  visualization
    .y(yAxisTxFees)
    .draw();
}

function showTxSize() {

  chartType = "txSize";

  setRange(txType, chartType);

  visualization
    .y(yAxisTxSize)
    .draw();
}

function showFeesSpB() {

  chartType = "SPB";

  setRange(txType, chartType);

  visualization
    .y(yAxisSpB)
    .draw();
}

function toggleOutliers(cb) {
  showOutliers = cb.checked;

  console.log("Toggling Outliers..");
  console.log("tx Type: " + txType);
  console.log("Chart Type: " + chartType);
  console.log("Show Outliers? " + showOutliers);


  yAxisSpB["mute"] = showOutliers ? [] : isOutlier;
  yAxisTxFees["mute"] = showOutliers ? [] : isOutlier;
  yAxisTxSize["mute"] = showOutliers ? [] : isOutlier;

  //console.log(yAxisSpB);
  //console.log(yAxisTxFees);
  //console.log(yAxisTxSize);

  switch (chartType) {
    case "SPB":
      visualization.y(yAxisSpB).draw();
      break;
    case "txFee":
      visualization.y(yAxisTxFees).draw();
      break;
    case "txSize":
      visualization.y(yAxisTxSize).draw();
      break;
    default:
      visualization.draw();
  }

}







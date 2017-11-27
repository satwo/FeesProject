

var blockRange;
var blockData;
var showOutliers = true;
var txType = "SegWit";
var chartType = "SPB";

var yAxisSpB;
var yAxisTxFees;
var yAxisTxFeesUSD;
var yAxisTxVSize;
var range;
var isOutlier;

fetch('./data.json').then(function (response) {
  return response.json();
}).then(function (data) {
  blockData = data.sort(function (a, b) { return a.Height - b.Height; });

  var blocksBack = 24; 

  var sliced = blockData.slice(blockData.length - blocksBack, blockData.length);

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

var yAxisLabelTxFeesUSD = {
  value: "USD / Tx",
  font: AxisLabelFont
}

var yAxisLabelTxVSize = {
  value: "Tx Size (VBytes)",
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
        "txFeeUSD": block.SegWitTxData.txFeesUSD_list[i],
        "txVSize": block.SegWitTxData.txVSize_list[i]
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
        "txFeeUSD": block.LegacyTxData.txFeesUSD_list[i],
        "txVSize": block.LegacyTxData.txVSize_list[i]
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

  yAxisTxFeesUSD = {
    value: "txFeeUSD",
    axis: true,
    grid: true,
    label: yAxisLabelTxFeesUSD,
    mute: isOutlier
  }
  
  yAxisTxVSize = {
    value: "txVSize",
    axis: true,
    grid: true,
    label: yAxisLabelTxVSize,
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
    .container("#datavis")
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
    case "txFeeUSD":
      range = outlierRange(data.map(d => d.txFeeUSD))
      break;
    case "txVSize":
      range = outlierRange(data.map(d => d.txVSize))
      break;
    default:
      break;

  }

  isOutlier = val => (val > range[1]);

  yAxisSpB["mute"] = showOutliers ? [] : isOutlier;
  yAxisTxFees["mute"] = showOutliers ? [] : isOutlier;
  yAxisTxFeesUSD["mute"] = showOutliers ? [] : isOutlier;
  yAxisTxVSize["mute"] = showOutliers ? [] : isOutlier;
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

function showTxFeesUSD() {
  
    chartType = "txFeeUSD";
  
    setRange(txType, chartType);
  
    visualization
      .y(yAxisTxFeesUSD)
      .draw();
  }

function showTxVSize() {

  chartType = "txVSize";

  setRange(txType, chartType);

  visualization
    .y(yAxisTxVSize)
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
  yAxisTxFeesUSD["mute"] = showOutliers ? [] : isOutlier;
  yAxisTxVSize["mute"] = showOutliers ? [] : isOutlier;

  setRange(txType, chartType);

  switch (chartType) {
    case "SPB":
      visualization.y(yAxisSpB).draw();
      break;
    case "txFee":
      visualization.y(yAxisTxFees).draw();
      break;
    case "txFeeUSD":
      visualization.y(yAxisTxFeesUSD).draw();
      break;
    case "txVSize":
      visualization.y(yAxisTxVSize).draw();
      break;
    default:
      visualization.draw();
  }

}







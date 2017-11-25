

var blockRange;
var blockData;

fetch('./data.json').then(function (response) {
  return response.json();
}).then(function (data) {
  blockData = data.sort(function (a, b) { return a.Height - b.Height; });

  var sliced = blockData.slice(blockData.length - 12, blockData.length);

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

var yAxisSpB = {
  value: "SPB",
  axis: true,
  grid: true,
  label: yAxisLabelSpB
}

var yAxisTxFees = {
  value: "txFee",
  axis: true,
  grid: true,
  label: yAxisLabelTxFees
  // mute: isOutlier
}

var yAxisTxSize = {
  value: "txSize",
  axis: true,
  grid: true,
  label: yAxisLabelTxSize
  // mute: isOutlier
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
  //var outlierRange = outlierRange(data.map(d=>d.value))
  //var isOutlier = val =>  (val < outlierRange[0] || val > outlierRange[1])

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

  console.log("DID NOT GET HERE");

}

function showSegwitData() {
  console.log("HIT");
  console.log(segwitData);
  visualization
    .data(segwitData)
    .draw();
}

function showLegacyData() {
  visualization
    .data(legacyData)
    .draw();
}

function showTxFees() {
  visualization
    .y(yAxisTxFees)
    .draw();
}

function showTxSize() {
  visualization
    .y(yAxisTxSize)
    .draw();
}

function showFeesSpB() {
  visualization
    .y(yAxisSpB)
    .draw();
}







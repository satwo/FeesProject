

var blockRange;
var blockData;

fetch('./data.json').then(function (response) {
  return response.json();
}).then(function (data) {
  blockData = data.sort(function (a, b) { return a.Height - b.Height; });

  var sliced = blockData.slice(blockData.length-6, blockData.length);

  RenderCharts(sliced);
});

var visualization;
var legacyData = [];
var segwitData = [];

function RenderCharts(blockData) {
  blockRange = blockData.map(a => a.Height);

  blockData.forEach(block => {
    arrayOfLegacyFees = block.LegacyTxData.satsPerByte_list;
    arrayOfLegacyFees.forEach(fee => {
      dataPoint = {
        "Height": block.Height,
        "name": Math.random(),
        "SPB": fee
      };
      legacyData.push(dataPoint);
    });

    arrayOfSegwitFees = block.SegWitTxData.satsPerByte_list;
    arrayOfSegwitFees.forEach(fee => {
      dataPoint = {
        "Height": block.Height,
        "name": Math.random(),
        "SPB": fee
      };
      segwitData.push(dataPoint);
    });
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
    label: xAxisLabel,
   // ticks: xTicks,
    padding: 100
  }

  var yAxisLabel = {
    value: "Satoshis/Byte", 
    font: AxisLabelFont
  }

  var yAxis = {
    value: "SPB",
    axis: true,
    grid: true,
    label: yAxisLabel,
  //  ticks: yTicks,
    padding: 100,
    // mute: isOutlier
  }

  //var outlierRange = outlierRange(data.map(d=>d.value))
  //var isOutlier = val =>  (val < outlierRange[0] || val > outlierRange[1])

  visualization = d3plus.viz()
    .container("#txFees")
    .data(segwitData)
    .type("box")
    .id("name")
    .x(xAxis)
    .y(yAxis)
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

function showSegwitData(){
    visualization.data(segwitData).draw();
}

function showLegacyData(){
  visualization.data(legacyData).draw();
}





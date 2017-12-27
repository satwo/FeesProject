var blockRange;
var blockData;
var selectedChartType;
var selectedOutlierLevel;
var segwitBlockHeights = [];
var legacyBlockHeights = [];

function outlierRange(extreme, mild, none) {
    this.extreme = extreme;
    this.mild = mild;
    this.none = none;
}

function ChartDataWithLayout(segwitDataArray, legacyDataArray, yAxis, outlierRange) {
    this.segwitData = segwitDataArray;
    this.legacyData = legacyDataArray;
    this.yAxis = yAxis;
    this.outlierRange = outlierRange;
}

var txFeesBTC = new ChartDataWithLayout([], [], { autotick: true, title: 'Tx Fees (BTC)', hoverformat: '0.8f' }, new outlierRange(0, 0, 0)),
    txFeesUSD = new ChartDataWithLayout([], [], { autotick: true, title: 'Tx Fees (USD)' }, new outlierRange(0, 0, 0)),
    txFeesSPB = new ChartDataWithLayout([], [], { autotick: true, title: 'Tx Fees (SPB)' }, new outlierRange(0, 0, 0)),
    txVSize = new ChartDataWithLayout([], [], { autotick: true, title: 'Tx Size (VBytes)' }, new outlierRange(0, 0, 0));

fetch('./data.json').then(function (response) {
    return response.json();
}).then(function (data) {
    blockData = data.sort(function (a, b) { return a.Height - b.Height; });

    var blocksBack = 12;

    var sliced = blockData.slice(blockData.length - blocksBack, blockData.length);

    ParseData(sliced);
});


function ParseData(blockData) {
    blockRange = blockData.map(a => a.Height);

    blockData.forEach(block => {

        console.log("BLOCK HEIGHT: " + block.Height);

        segwitTxCount = block.SegWitTxData.txCount;
        for (var i = 0; i < segwitTxCount; i++) { segwitBlockHeights.push(String(block.Height)); }
        txFeesBTC.segwitData.push(...block.SegWitTxData.txFees_list);
        txFeesUSD.segwitData.push(...block.SegWitTxData.txFeesUSD_list);
        txFeesSPB.segwitData.push(...block.SegWitTxData.satsPerByte_list);
        txVSize.segwitData.push(...block.SegWitTxData.txVSize_list);

        legacyTxCount = block.LegacyTxData.txCount;
        for (var i = 0; i < legacyTxCount; i++) { legacyBlockHeights.push(String(block.Height)); }
        txFeesBTC.legacyData.push(...block.LegacyTxData.txFees_list);
        txFeesUSD.legacyData.push(...block.LegacyTxData.txFeesUSD_list);
        txFeesSPB.legacyData.push(...block.LegacyTxData.satsPerByte_list);
        txVSize.legacyData.push(...block.LegacyTxData.txVSize_list);

        setUpperRange(block.SegWitTxData.txFees_list, txFeesBTC);
        setUpperRange(block.LegacyTxData.txFees_list, txFeesBTC);
        setUpperRange(block.SegWitTxData.txFeesUSD_list, txFeesUSD);
        setUpperRange(block.LegacyTxData.txFeesUSD_list, txFeesUSD);
        setUpperRange(block.SegWitTxData.satsPerByte_list, txFeesSPB);
        setUpperRange(block.LegacyTxData.satsPerByte_list, txFeesSPB);
        setUpperRange(block.SegWitTxData.txVSize_list, txVSize);
        setUpperRange(block.LegacyTxData.txVSize_list, txVSize);

    });
    selectedChartType = "txFeesSPB";
    selectedOutlierLevel = "none";
    showChart(selectedChartType);

    console.log(txFeesBTC.outlierRange);
}

function setUpperRange(data, chart) {

    var thisUpperRangeOutlierExtreme = getOutlierRange(data, 'extreme', true)[1];
    var thisUpperRangeOutlierMild = getOutlierRange(data, 'mild', true)[1]
    var thisUpperRangeOutlier = getOutlierRange(data, 'none', true)[1]


    chart.outlierRange.extreme = thisUpperRangeOutlierExtreme > chart.outlierRange.extreme ? thisUpperRangeOutlierExtreme : chart.outlierRange.extreme;
    chart.outlierRange.mild = thisUpperRangeOutlierMild > chart.outlierRange.mild ? thisUpperRangeOutlierMild : chart.outlierRange.mild;
    chart.outlierRange.none = thisUpperRangeOutlier > chart.outlierRange.none ? thisUpperRangeOutlier : chart.outlierRange.none;
}

function showChart(chartType) {

    selectedChartType = chartType;
    var thisChart;

    switch (chartType) {
        case "txFeesBTC":
            thisChart = txFeesBTC;
            break;
        case "txFeesUSD":
            thisChart = txFeesUSD;
            break;
        case "txFeesSPB":
            thisChart = txFeesSPB;
            break;
        case "txVSize":
            thisChart = txVSize;
            break;
            default:
            console.log("NO CHART TYPE SELECTED");
            break;
    }

    switch (selectedOutlierLevel) {
        case "none":
            thisChart.yAxis.range = [0, thisChart.outlierRange.none];
            break;
        case "mild":
            thisChart.yAxis.range = [0, thisChart.outlierRange.mild];
            break;
        case "extreme":
            thisChart.yAxis.range = [0, thisChart.outlierRange.extreme];
            break;
        default:
        console.log("NO OUTLIER SELECTED");
        break;
    }


    segwitTrace = {
        y: thisChart.segwitData,
        x: segwitBlockHeights,
        name: 'segwit',
        marker: { color: '#3D9970' },
        type: 'box'
    };

    legacyTrace = {
        y: thisChart.legacyData,
        x: legacyBlockHeights,
        name: 'legacy',
        marker: { color: '#FF4136' },
        type: 'box'
    };

    data = [segwitTrace, legacyTrace];

    var layout = {
        yaxis: thisChart.yAxis,
        boxmode: 'group',
        hovermode: 'x',
        xaxis: {
            title: "Block Height",
            dtick: 1,
            ticklen: 2,
            tickwidth: 1,
            tickcolor: '#000',
            tickvals: legacyBlockHeights,
            ticktext: legacyBlockHeights
        },
    };

    Plotly.purge('datavisPlotly');
    Plotly.newPlot('datavisPlotly', data, layout)
}

//https://stackoverflow.com/questions/20811131/javascript-remove-outlier-from-an-array
function getOutlierRange(dataArray, outlierType, upperOnly) {

    let values, q1, q3, iqr, maxValue, minValue, multiple;

    if (dataArray === undefined)
        return;

    if (dataArray.length < 4)
        return dataArray;

    values = dataArray.slice().sort((a, b) => a - b);//copy array fast and sort

    if ((values.length / 4) % 1 === 0) {//find quartiles
        q1 = 1 / 2 * (values[(values.length / 4)] + values[(values.length / 4) + 1]);
        q3 = 1 / 2 * (values[(values.length * (3 / 4))] + values[(values.length * (3 / 4)) + 1]);
    } else {
        q1 = values[Math.floor(values.length / 4 + 1)];
        q3 = values[Math.ceil(values.length * (3 / 4) + 1)];
    }

    iqr = q3 - q1; //inner-quartile range

    switch (outlierType) {
        case "extreme":
            maxValue = values[values.length - 1] + (values[values.length - 1]) * 0.02; //q3 + iqr * 3;
            minValue = upperOnly ? 0 : q1 - iqr * 3;
            break;
        case "mild":
            maxValue = q3 + iqr * 3 + (values[values.length - 1]) * 0.02;
            minValue = upperOnly ? 0 : q1 - iqr * 1.5;
            break;
        default:
            maxValue = q3 + iqr + (values[values.length - 1]) * 0.02;
            minValue = upperOnly ? 0 : q1 - iqr;
            break;
    }


    minValue = minValue < 0 ? 0 : minValue;

    return [minValue, maxValue];
}

function outlierLevel(level) {

    if (level !== selectedOutlierLevel) {
        selectedOutlierLevel = level;

        showChart(selectedChartType);
    }
}


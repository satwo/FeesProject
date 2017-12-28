var blockRange;
var blockData;
var selectedChartType;
var selectedOutlierLevel;
var segwitBlockHeights = [];
var legacyBlockHeights = [];

var graphDiv = document.getElementById('datavisPlotly');

var chartTypes = ['Tx Fees SPB', 'Tx Fees BTC', 'Tx Fees USD', 'Tx Size'];

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

var txFeesBTC = new ChartDataWithLayout([], [], { autotick: true, title: 'Tx Fees (BTC)', rangemode: 'nonnegative', hoverformat: '0.8f' }, new outlierRange(0, 0, 0)),
    txFeesUSD = new ChartDataWithLayout([], [], { autotick: true, title: 'Tx Fees (USD)', rangemode: 'nonnegative', }, new outlierRange(0, 0, 0)),
    txFeesSPB = new ChartDataWithLayout([], [], { autotick: true, title: 'Tx Fees (SPB)', rangemode: 'nonnegative', }, new outlierRange(0, 0, 0)),
    txVSize = new ChartDataWithLayout([], [], { autotick: true, title: 'Tx Size (VBytes)', rangemode: 'nonnegative', }, new outlierRange(0, 0, 0));

fetch('./data.json').then(function (response) {
    return response.json();
}).then(function (data) {
    blockData = data.sort(function (a, b) { return a.Height - b.Height; });

    var blocksBack = 24;

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

    //console.log(txFeesBTC.outlierRange);
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
    var data = [];

    /*     switch (chartType) {
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
        } */

    chartTypes.forEach(chart => {

        var thisChart;

        switch (chart) {
            case "Tx Fees BTC":
                thisChart = txFeesBTC;
                break;
            case "Tx Fees USD":
                thisChart = txFeesUSD;
                break;
            case "Tx Fees SPB":
                thisChart = txFeesSPB;
                break;
            case "Tx Size":
                thisChart = txVSize;
                break;
            default:
                console.log("NO CHART TYPE SELECTED");
                break;
        }


        segwitTrace = {
            y: thisChart.segwitData,
            x: segwitBlockHeights,
            name: 'segwit',
            visible: chart === chartTypes[0] ? true : false,
            marker: { color: '#3D9970' },
            type: 'box',
            boxpoints: false,
            jitter: 0.3,
            boxmean: false
        };

        legacyTrace = {
            y: thisChart.legacyData,
            x: legacyBlockHeights,
            visible: chart === chartTypes[0] ? true : false,
            name: 'legacy',
            marker: { color: '#FF4136' },
            type: 'box',
            boxpoints: false,
            jitter: 0.3,
            boxmean: false
        };

        data.push(segwitTrace, legacyTrace);
    });


    var layout = {
        autosize: true,
        title: "Tx Fees - Satoshis/VByte",
        yaxis: txFeesSPB.yAxis,
        boxmode: 'group',
        hovermode: 'x',
        margin: {
            l: 60,
            r: 0,
            b: 40,
            t: 40,
            pad: 0
        },
        xaxis: {
            title: "Block Height",
            dtick: 1,
            ticklen: 2,
            tickwidth: 1,
            tickcolor: '#000',
            tickvals: legacyBlockHeights,
            ticktext: legacyBlockHeights
        },
        updatemenus: [{
            y: 0.6,
            x: 1.1,
            yanchor: 'top',
            buttons: [{
                method: 'restyle',
                args: ['boxmean', false],
                label: 'No Mean'
            }, {
                method: 'restyle',
                args: ['boxmean', true],
                label: 'Mean'
            }, {
                method: 'restyle',
                args: ['boxmean', 'sd'],
                label: 'Mean + SD'
            }]
        }, {
            y: 0.7,
            x: 1.1,
            yanchor: 'top',
            buttons: [{
                method: 'restyle',
                args: ['boxpoints', false],
                label: 'Whiskers Only'
            }, {
                method: 'restyle',
                args: ['boxpoints', 'Outliers'],
                label: 'Whiskers & Outliers'
            }]
        }, {
            y: 0.8,
            x: 1.1,
            yanchor: 'top',
            buttons: [{
                method: 'restyle',
                args: ['visible', [true, true, false, false, false, false, false, false]],
                label: 'Tx Fees (Sats/VByte)'
            }, {
                method: 'restyle',
                args: ['visible', [false, false, true, true, false, false, false, false]],
                label: 'Tx Fees (BTC)'
            }, {
                method: 'restyle',
                args: ['visible', [false, false, false, false, true, true, false, false]],
                label: 'Tx Fees (USD)'
            }, {
                method: 'restyle',
                args: ['visible', [false, false, false, false, false, false, true, true]],
                label: 'Tx Size (VBytes)'
            }]
        }],
    };

    //Plotly.purge('datavisPlotly');
    Plotly.plot('datavisPlotly', data, layout);

    graphDiv.on('plotly_restyle', function (eventData) {

        var update;

        if (Object.keys(eventData[0] === 'visible')) {

            if (eventData[0]["visible"][0] === true) {
                update = {
                    title: "Tx Fees (Satoshis / VByte)",
                    yaxis: txFeesSPB.yAxis
                };
            };
            if (eventData[0]["visible"][2] === true) {
                update = {
                    title: "Tx Fees (BTC)",
                    yaxis: txFeesBTC.yAxis
                };
            };
            if (eventData[0]["visible"][4] === true) {
                update = {
                    title: "Tx Fees (USD)",
                    yaxis: txFeesUSD.yAxis
                };
            };
            if (eventData[0]["visible"][6] === true) {
                update = {
                    title: "Tx Size (VBytes)",
                    yaxis: txVSize.yAxis
                };
            };

            Plotly.relayout(graphDiv, update);
        }
    });
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
            maxValue = q3 + iqr * 1.5 + (values[values.length - 1]) * 0.02; //added 1.5 temporarily while only using mild and extreme
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






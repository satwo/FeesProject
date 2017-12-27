from bitcoin.rpc import RawProxy
import bitcoin
import numpy as np
import csv
import json
import shutil
import os
import simplejson
from decimal import Decimal
import requests


r = requests.get('http://coincap.io/history/1day/BTC')
usdData = r.json()
priceData = usdData["price"]

#bitcoin.SelectParams('regtest')
#bitcoin.SelectParams('testnet')
bitcoin.SelectParams('mainnet')
p = RawProxy()

fw = open('public/transtats.txt','w')
writer = csv.writer(fw)

jsonfile = 'public/data.json'
data = []

if os.path.exists(jsonfile):
    with open(jsonfile) as json_data:
        if os.stat(jsonfile).st_size > 0:
            data = json.load(json_data)
else:
    open(jsonfile, 'w')

firstSegwitBlock = 481824

currentHeight = p.getblock(p.getbestblockhash())['height']

startingHeight = currentHeight - 12 

# def nearest(items, pivot):
#     return min(items, key=lambda x: abs(x - pivot))

def process_block(height, blockhash):

    print('processing block: height=%d hash=%s' % (height, blockhash))
    thisBlockJson = filter(lambda block: block['Height'] == height, data)

    if len(thisBlockJson):

        if thisBlockJson[0]["Height"] == height and thisBlockJson[0]["Hash"] == blockhash:
            print('* already processed in db')
            return

        if thisBlockJson[0]["Height"] == height and thisBlockJson[0]["Hash"] != blockhash:
            print('* reorganize blockchain, different hash at same height')
            data.remove(thisBlockJson[0])
            add_new_block(height, blockhash)

        else:
            print('* new block')
            add_new_block(height, blockhash)
    else:
        print('* new block')
        add_new_block(height, blockhash)

def add_new_block(height, blockhash):
    transactions = block['tx']
    total_fees = 0
    block_timestamp = block['time']

    #get closest USD price (Coincap.io) before block mined

    for idx,e in enumerate(priceData):
        timestamp,price = e
        if block_timestamp < timestamp:
            break
    USD_Price = priceData[idx-1][1]

    segwitTxCount = 0
    legacyTxCount = 0

    fees = {'SegWit':[],'Legacy':[]}
    feesUSD = {'SegWit':[],'Legacy':[]}
    inputs = {'SegWit':[],'Legacy':[]}
    outputs = {'SegWit':[],'Legacy':[]}
    sizes = {'SegWit':[],'Legacy':[]}
    vsizes = {'SegWit':[],'Legacy':[]}
    satsPerByte = {'SegWit':[],'Legacy':[]}
    satsPerVByte = {'SegWit':[],'Legacy':[]}

    #iterate through transactions
    for tnum,txid in enumerate(transactions):

        raw_tx = p.getrawtransaction(txid)
        decoded_tx = p.decoderawtransaction(raw_tx)

        size = decoded_tx['size']
        vsize = decoded_tx['vsize']
        num_inputs = len(decoded_tx['vin'])
        num_outputs = len(decoded_tx['vout'])

        tx_value = 0
        for output in decoded_tx['vout']:
            tx_value += output['value']

        if tnum > 0:
            tx_inputs = 0
            for inp in decoded_tx['vin']:
                if 'txid' in inp:
                    raw_input_tx = p.getrawtransaction(inp['txid'])
                    decoded_input_tx = p.decoderawtransaction(raw_input_tx)
                    raw_input_utxo_idx = inp['vout']
                    tx_input = decoded_input_tx['vout'][raw_input_utxo_idx]['value'] #error found here
                    tx_inputs += tx_input

            tran_fee = tx_inputs - tx_value
            total_fees += tran_fee

            ttype = 'SegWit' if raw_tx[8:12] == '0001' else 'Legacy'

            if ttype == 'SegWit':
                segwitTxCount += 1
            else:
                legacyTxCount += 1

            fees[ttype].append(float(tran_fee))
            feesUSD[ttype].append(round((float(tran_fee) * float(USD_Price)), 2))
            inputs[ttype].append(num_inputs)
            outputs[ttype].append(num_outputs)
            sizes[ttype].append(float(size))
            vsizes[ttype].append(float(vsize))

            satPerByteFormatted = round(((tran_fee / size) * 100000000))
            satsPerByte[ttype].append(satPerByteFormatted)

            satPerVByteFormatted = round(((tran_fee / vsize) * 100000000))
            satsPerVByte[ttype].append(satPerVByteFormatted)


    fees_segwit,fees_legacy = sum(fees['SegWit']),sum(fees['Legacy'])
    size_segwit,size_legacy = sum(sizes['SegWit']),sum(sizes['Legacy'])
    vsize_segwit,vsize_legacy = sum(vsizes['SegWit']),sum(vsizes['Legacy'])
    inputs_segwit,inputs_legacy = sum(inputs['SegWit']),sum(inputs['Legacy'])
    outputs_segwit,outputs_legacy = sum(outputs['SegWit']),sum(outputs['Legacy'])
    tranct_segwit,tranct_legacy = len(fees['SegWit']),len(fees['Legacy'])
    

    if (segwitTxCount > 0):
        avgSegwitTxFee = round((fees_segwit / segwitTxCount), 8)
        avgSegwitTxSize = round((size_segwit / segwitTxCount))
        avgSegwitTxVSize = round((vsize_segwit / segwitTxCount))
    else:
        avgSegwitTxFee = 0
        avgSegwitTxSize = 0
        avgSegwitTxVSize = 0

    if len(satsPerByte['SegWit']):
        meanSPB_segwit= round(np.mean(satsPerByte['SegWit']))
        stdSPB_segwit= round(np.std(satsPerByte['SegWit']))
        medianSPB_segwit= round(np.median(satsPerByte['SegWit']))
        minSPB_segwit= round(np.nanmin(satsPerByte['SegWit']))
        maxSPB_segwit= round(np.nanmax(satsPerByte['SegWit']))
        firstQuartileSPB_segwit= round(np.percentile(satsPerByte['SegWit'], 25))
        thirdQuartileSPB_segwit= round(np.percentile(satsPerByte['SegWit'], 75))
    else:
        meanSPB_segwit= 0
        stdSPB_segwit= 0
        medianSPB_segwit= 0
        minSPB_segwit= 0
        maxSPB_segwit= 0
        firstQuartileSPB_segwit= 0
        thirdQuartileSPB_segwit= 0

    if (legacyTxCount > 0):
        avgLegacyTxFee = round((fees_legacy / legacyTxCount), 8)
        avgLegacyTxSize = round((size_legacy / legacyTxCount))
        avgLegacyTxVSize = round((vsize_legacy / legacyTxCount))
    else:
        avgLegacyTxFee = 0
        avgLegacyTxSize = 0
        avgLegacyTxVSize = 0

    if len(satsPerByte['Legacy']):
        meanSPB_legacy = round(np.mean(satsPerByte['Legacy']))
        stdSPB_legacy = round(np.std(satsPerByte['Legacy']))
        medianSPB_legacy = round(np.median(satsPerByte['Legacy']))
        minSPB_legacy = round(np.nanmin(satsPerByte['Legacy']))
        maxSPB_legacy = round(np.nanmax(satsPerByte['Legacy']))
        firstQuartileSPB_legacy = round(np.percentile(satsPerByte['Legacy'], 25))
        thirdQuartileSPB_legacy = round(np.percentile(satsPerByte['Legacy'], 75))
    else:
        meanSPB_legacy = 0
        stdSPB_legacy = 0
        medianSPB_legacy = 0
        minSPB_legacy = 0
        maxSPB_legacy = 0
        firstQuartileSPB_legacy = 0
        thirdQuartileSPB_legacy = 0

    '''     
    print('\n')
    print('SEGWIT DATA')


    print('avg segwit tx fee: ' + str(avgSegwitTxFee))
    print('avg segwit tx size: ' + str(avgSegwitTxSize))

    print('total fees seg: ' + str(fees_segwit))
    print('total size seg: ' +  str(size_segwit))
    print('total # segwit tx: ' + str(segwitTxCount))
    
    print('\n')
    print('Mean sat/byte Segwit: ' + str(meanSPB_segwit))
       
    print('Min sat/byte Segwit: ' + str(minSPB_segwit))
    print('25pct sat/byte Segwit: ' + str(firstQuartileSPB_segwit))
    print('Median sat/byte Segwit: ' + str(medianSPB_segwit)) 
    print('75pct sat/byte Segwit: ' + str(thirdQuartileSPB_segwit)) 
    print('Max sat/byte Segwit: ' + str(maxSPB_segwit))     

    print('Segwit Standard Deviation: ' + str(stdSPB_segwit))

    print('\n')
    print('LEGACY DATA')


    print('avg legacy tx fee: ' + str(avgLegacyTxFee))
    print('avg legacy tx size: ' + str(avgLegacyTxSize))

    print('total fees legacy: ' +  str(fees_legacy))
    print('total size legacy: ' + str(size_legacy))
    print('total legacy tx: ' + str(legacyTxCount))

    print('\n')
    print('Mean sat/byte Legacy: ' + str(meanSPB_legacy))    
    
    print('Min sat/byte Legacy: ' + str(minSPB_legacy))
    print('25pct sat/byte Legacy: ' + str(firstQuartileSPB_legacy))
    print('Median sat/byte Legacy: ' + str(medianSPB_legacy))
    print('75pct sat/byte Legacy: ' + str(thirdQuartileSPB_legacy))  
    print('Max sat/byte Legacy: ' + str(maxSPB_legacy))   
    
    print('Legacy Standard Deviation: ' + str(stdSPB_legacy)) 
    

    print('\n')'''
    
    writer.writerow(map(str,[height,fees_segwit,fees_legacy,size_segwit,size_legacy,\
                            inputs_segwit,inputs_legacy,outputs_segwit,outputs_legacy,\
                            tranct_segwit,tranct_legacy]))


    data.append({
        'SegWitTxData': 
            {
                'satsPerByte_list' : satsPerByte['SegWit'],
                'satsPerVByte_list' : satsPerVByte['SegWit'],
                'txFees_list' : fees['SegWit'],
                'txSize_list': sizes['SegWit'],
                'txVSize_list': vsizes['SegWit'],
                'txFeesUSD_list': feesUSD['SegWit'],
                'txCount': segwitTxCount,
                'sizeInBytes': round(size_segwit, 8),
                'totalFees': round(fees_segwit, 8),
                'averageTxFee': avgSegwitTxFee,
                'averageTxSize': avgSegwitTxSize,
                'averageTxVSize': avgSegwitTxVSize,
                'meanSPB': meanSPB_segwit,
                'minSPB': minSPB_segwit,
                'firstQuartileSPB' : firstQuartileSPB_segwit,
                'medianSPB' : medianSPB_segwit,
                'thirdQuartileSPB': thirdQuartileSPB_segwit,
                'maxSPB' : maxSPB_segwit,
                'standardDeviationSPB': stdSPB_segwit
            },
        'LegacyTxData':
            {
                'satsPerByte_list' : satsPerByte['Legacy'],
                'satsPerVByte_list' : satsPerVByte['Legacy'],
                'txFees_list' : fees['Legacy'],
                'txSize_list': sizes['Legacy'],
                'txVSize_list': vsizes['Legacy'],
                'txFeesUSD_list': feesUSD['Legacy'],
                'txCount': legacyTxCount,
                'sizeInBytes': round(size_legacy, 8),
                'totalFees': round(fees_legacy, 8),
                'averageTxFee': avgLegacyTxFee,
                'averageTxSize': avgLegacyTxSize,
                'averageTxVSize': avgLegacyTxVSize,
                'meanSPB': meanSPB_legacy,
                'minSPB': minSPB_legacy,
                'firstQuartileSPB' : firstQuartileSPB_legacy,
                'medianSPB' : medianSPB_legacy,
                'thirdQuartileSPB': thirdQuartileSPB_legacy,
                'maxSPB' : maxSPB_legacy,
                'standardDeviationSPB': stdSPB_legacy
            },
            'Height': height,
            'Timestamp': block_timestamp,
            'USD_Price': USD_Price,
            'Hash': blockhash
    })

while startingHeight < p.getblock(p.getbestblockhash())['height']:
    startingHeight += 1
    print('Block height: ' + str(startingHeight))
    blockhash = p.getblockhash(startingHeight)
    block = p.getblock(blockhash)

    process_block(startingHeight, blockhash)

fw.close()

sorted_list = sorted(data, key=lambda k: int(k['Height']), reverse=False)

shutil.copyfile(jsonfile, 'public/data.json.last')

with open(jsonfile, 'w') as outfile:
    json.dump(sorted_list, outfile, sort_keys=True)

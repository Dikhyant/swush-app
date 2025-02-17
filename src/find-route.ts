
// add main function
async function main() {
    const response = await fetch('http://localhost:3001/api/v1/assets/find-route', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        fromAsset: {
            id: "DOT",
            xcmLocation: {
                parents: 1,
                interior: "Here"
            },
            metadata: {
                decimals: 10
            },
            hydradx: {
                assetId: "0"
            }
        },
        toAsset: {
            id: "USDC",
            xcmLocation: { 
                parents: 0,
                interior: {
                  type: "X2",
                  value: [
                    {
                      "type": "PalletInstance",
                      "value": 50
                    },
                    {
                      "type": "GeneralIndex",
                      "value": "1337"
                    }
                  ]
                }
            },
            metadata: {
                decimals: 6
            }
        },
        amountIn: "1000000000000" // 1 DOT in base units
    })
});

    console.log(response);
}

main();

import './App.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import styled from 'styled-components';
import ContractABI from './artifacts/contracts/Game.json';

declare var window: any;

const Div = styled.div<{
  mt?: string,
  mb?: string
}>`
margin-top: ${({ mt }) => mt ?? '12px'};
margin-bottom: ${({ mb }) => mb ?? '12px'};
`;

const Button = styled.button<{
  ml?: string,
  pt?: string,
  pb?: string,
  pl?: string,
  pr?: string,
}>`
padding-top: ${({ pt }) => pt ?? '10px'};
padding-bottom: ${({ pb }) => pb ?? '10px'};
padding-left: ${({ pl }) => pl ?? '16px'};
padding-right: ${({ pr }) => pr ?? '16px'};
background-color: cornflowerblue;
border-radius: 4px;
font-weight: bold;
color: white;
border: none;
cursor: pointer;
margin-left: ${({ ml }) => ml}
`;

const Input = styled.input<{}>`
width: 50px;
margin-right: 5px;
`;

export default function App() {

  const providerRef = useRef<ethers.providers.Web3Provider | undefined>(undefined);
  const signerRef = useRef<any | undefined>(undefined);
  const contractRef = useRef<any | undefined>(undefined);
  const [accounts, setAccounts] = useState<Array<string>>([]);

  useEffect(() => {
    if (window.ethereum && providerRef.current === undefined) {
      providerRef.current = new ethers.providers.Web3Provider(window.ethereum)
      signerRef.current = providerRef.current.getSigner()
      // set up MyContract
      contractRef.current = new ethers.Contract(ContractABI.networks[4].address, ContractABI.abi, signerRef.current);
    }
  }, []);

  const getUsersCoinBalance = useCallback(async () => {
    const result = await contractRef.current.getUserBal();    
    setCoinBalance(toNormalNumber(result))
  }, [contractRef]);

  useEffect(() => {
    (async () => await getUsersCoinBalance())();
  });

  const BASE_COIN_18_DECIMALS = 1000000000000000000;
  const BASE_ETHER_25 = 10000000000000000000000000;

  const [tokenSpendValue, setTokenSpendValue] = useState<string>('0');
  const [transactionApproved, setTransactionApproved] = useState<boolean>(false);
  const [coinBalance, setCoinBalance] = useState<string>('0.0');

  const toNormalNumber = (bn: BigNumber) => ethers.utils.formatEther(bn.toString());

  return (
    <div className="App">
      <Div>
        This app needs your permission to use your account(s)
      </Div>
      <Button
        onClick={async () => {
          if (providerRef.current) {
            const _accounts = await providerRef.current.send('eth_requestAccounts', [])
            setAccounts(_accounts)
          }
        }}
      >
        Request Permission
      </Button>
      {
        contractRef.current &&
        accounts.length > 0 && (
          <>
            <Div mt='30px'>
              Your Account(s):
            </Div>
            <Div
              style={{
                backgroundColor: '#333',
                color: '#fff',
                padding: '8px',
                width: '180px',
                textAlign: 'center',
                margin: '0 auto',
                marginBottom: '20px',
                borderRadius: '3px'
              }}
            >
              Coin Balance: {coinBalance}
            </Div>
            {
              accounts.map((acct, i) => (
                <Div key={i}>
                  <Div
                    style={{
                      backgroundColor: '#333',
                      color: '#fff',
                      padding: '8px',
                      width: '400px',
                      textAlign: 'center',
                      margin: '0 auto',
                      marginBottom: '20px',
                      borderRadius: '3px'
                    }}
                  >
                    {acct}
                  </Div>
                  <div>
                    Available "{ContractABI.contractName}" Contract Methods
                  </div>
                  {
                    <Div>
                      <Div>
                        <Button ml='12px' pt='6px' pb='6px' pl='10px' pr='10px'
                          onClick={async () => {
                            // get $20 of ether value (fig. out from coingecko api perhaps), just random amt for now
                            const result = await contractRef.current.buyCoins({ value: ethers.utils.parseEther('0.005') })
                            console.log(
                              result
                            );
                            if (providerRef && providerRef.current) {
                              providerRef.current.once(result.hash, (transaction) => {
                                // Emitted when the transaction has been mined
                                console.log(
                                  result.hash,
                                  transaction
                                );
                                getUsersCoinBalance();
                              });
                            }
                          }}
                        >
                          Buy tokens
                        </Button>
                        <Button ml='12px' pt='6px' pb='6px' pl='10px' pr='10px'
                          onClick={getUsersCoinBalance}
                        >
                          Check Token Balance
                        </Button>
                        <br />
                        <Div>
                          <Div mt='0'>
                            Buy some in-game items or something..
                          </Div>
                          <>
                            {
                              !transactionApproved
                                // transactionApproved
                                ? <Button ml='12px' pt='6px' pb='6px' pl='10px' pr='10px'
                                  onClick={async () => {
                                    const result = await contractRef.current.approveSpend();
                                    console.log(
                                      result
                                    );
                                    if (providerRef && providerRef.current) {
                                      providerRef.current.once(result.hash, (transaction) => {
                                        // Emitted when the transaction has been mined
                                        console.log(
                                          result.hash,
                                          transaction
                                        );
                                        setTransactionApproved(true); // will need to get transaction approval upon app load to check against and set the proper state
                                      });
                                    }
                                  }}
                                >
                                  Approval to Spend DETH
                                </Button>
                                : <>
                                  <Input
                                    min={0}
                                    max={100}
                                    type={'number'}
                                    value={tokenSpendValue}
                                    onChange={e => setTokenSpendValue(e.currentTarget.value)}
                                  />
                                  <Button ml='12px' pt='6px' pb='6px' pl='10px' pr='10px'
                                    onClick={async () => {
                                      const result = await contractRef.current.spendCoins(
                                        (tokenSpendValue as unknown as number * BASE_COIN_18_DECIMALS).toString()
                                      );
                                      console.log(result);
                                      if (providerRef && providerRef.current) {
                                        providerRef.current.once(result.hash, (transaction) => {
                                          // Emitted when the transaction has been mined
                                          console.log(
                                            result.hash,
                                            transaction
                                          )
                                          setTransactionApproved(false);
                                          getUsersCoinBalance();
                                          setTokenSpendValue('0');
                                        });
                                      }
                                    }}
                                  >
                                    Spend tokens
                                  </Button>
                                </>
                            }
                          </>
                        </Div>
                      </Div>
                    </Div>
                  }
                </Div>
              ))
            }
          </>
        )
      }
    </div>
  );
}
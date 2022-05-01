import './App.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import styled from 'styled-components';
import ContractABI from './artifacts/contracts/Game.json';

declare var window: any;

const Div = styled.div<{
  mt?: string,
  mb?: string,
  bg?: string,
  radius?: string,
  w?: string,
  p?: string,
}>`
margin: auto;
background-color: ${({ bg }) => bg ?? 'unset'};
border-radius: ${({ radius }) => radius ?? '0px'};
width: ${({ w }) => w ?? '500px'};
padding: ${({ p }) => p ?? '0'};
position: relative;
margin-top: ${({ mt }) => mt ?? '12px'};
margin-bottom: ${({ mb }) => mb ?? '12px'};
`;

const Button = styled.button<{
  ml?: string,
  mr?: string,
  pt?: string,
  pb?: string,
  pl?: string,
  pr?: string,
  display?: string,
}>`
padding-top: ${({ pt }) => pt ?? '10px'};
padding-bottom: ${({ pb }) => pb ?? '10px'};
padding-left: ${({ pl }) => pl ?? '16px'};
padding-right: ${({ pr }) => pr ?? '16px'};
display: ${({ display }) => display ?? 'auto'};
background-color: cornflowerblue;
border-radius: 4px;
font-weight: bold;
color: ${({ color }) => color ?? 'white'};;
border: none;
cursor: pointer;
margin-left: ${({ ml }) => ml};
margin-right: ${({ mr }) => mr};
`;

const Input = styled.input<{
  ml?: string,
  mr?: string,
}>`
width: 40px;
font-size: 1rem;
margin-left: ${({ ml }) => ml ?? '0'};
margin-right: ${({ mr }) => mr ?? '0'};
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
      // set up contract, connect to methods in the ABI interface
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
  const [coinBalance, setCoinBalance] = useState<string>('0.0');

  const toNormalNumber = (bn: BigNumber) => ethers.utils.formatEther(bn.toString());

  return (
    <div className="App" >
      {
        accounts.length < 1 ?
          <>
            <Div>
              Connect Web3 wallet
            </Div>
            <Button
              onClick={async () => {
                if (providerRef.current) {
                  const _accounts = await providerRef.current.send('eth_requestAccounts', [])
                  setAccounts(_accounts)
                }
              }}
            >
              Connect
            </Button>
          </>
          : null
      }
      {
        contractRef.current &&
        accounts.length > 0 && (
          <>
            <Div mt='30px'>
              Your Account(s):
            </Div>
            <Div
              style={{
                backgroundColor: '#111',
                color: '#fff',
                padding: '8px',
                width: '180px',
                textAlign: 'center',
                margin: '0 auto',
                borderRadius: '3px',
                marginBottom: '4px',
                fontSize: '0.85rem'
              }}
            >
              Coin Balance: {coinBalance}
            </Div>

            <Div
              style={{
                backgroundColor: '#111',
                color: '#fff',
                padding: '8px',
                width: '400px',
                textAlign: 'center',
                margin: '0 auto',
                borderRadius: '3px',
                fontSize: '0.85rem'
              }}
            >
              {accounts[0]}
            </Div>

            <Div p='30px' mt='30px' mb='30px' radius='4px' bg='rgba(0, 0, 0, 0.1)'>
              <Div>
                Available "{ContractABI.contractName}" Contract Methods
              </Div>
              <Div>
                Buy Some Coins
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
                  Buy Coins
                </Button>
                <Button display='inline-block' ml='12px' pt='6px' pb='6px' pl='10px' pr='10px'
                  onClick={async () => {
                    await getUsersCoinBalance();
                    window.alert(`You have ${coinBalance} COINs`)
                  }}
                >
                  Check Coin Balance
                </Button>
              </Div>
              <Div>
                Spend Your Coins
                <Input
                  ml='10px'
                  min={0}
                  max={100}
                  type={'number'}
                  value={tokenSpendValue}
                  onChange={e => setTokenSpendValue(e.currentTarget.value)}
                />
                <Button ml='2px' pt='6px' pb='6px' pl='10px' pr='10px'
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
                        );
                        getUsersCoinBalance();
                        setTokenSpendValue('0');
                      });
                    }
                  }}
                >
                  Spend Coins
                </Button>
              </Div>
            </Div>

          </>
        )
      }
    </div>
  );
}
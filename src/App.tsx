import './App.css';
import React, { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import ContractABI from './artifacts/contracts/MyContract.json';

declare var window: any;

const Div = styled.div<{
  mt?: string,
  mb?: string
}>`
margin-top: ${({ mt }) => mt ?? '12px'};
margin-bottom: ${({ mb }) => mb ?? '12px'};
`

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
`

export default function App() {

  const providerRef = useRef<ethers.providers.Web3Provider | undefined>(undefined)
  const signerRef = useRef<any | undefined>(undefined)
  const contractRef = useRef<any | undefined>(undefined)
  const [accounts, setAccounts] = useState<Array<string>>([])
  // const [addressToQuery, setAddressToQuery] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (window.ethereum && providerRef.current === undefined) {
      providerRef.current = new ethers.providers.Web3Provider(window.ethereum)
      signerRef.current = providerRef.current.getSigner()
      // set up MyContract
      contractRef.current = new ethers.Contract(ContractABI.networks[4].address, ContractABI.abi, signerRef.current)
    }
  }, [])

  // const checkBalance = async (): Promise<any> => {
  //   const bal: BigNumber | undefined = await providerRef.current?.getBalance('ethers.eth')
  //   console.log(
  //     ethers.utils.formatEther(bal!)
  //   )
  // }

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
            {
              accounts.map((acct, i) => (
                <Div key={i}>
                  <Div
                    style={{
                      backgroundColor: '#333',
                      color: '#fff',
                      padding: '8px',
                      width: '500px',
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
                            const result = await contractRef.current.hitContract()
                            console.log(
                              result
                            )
                          }}
                        >
                          hitContract
                        </Button>
                        <Button ml='12px' pt='6px' pb='6px' pl='10px' pr='10px'
                          onClick={async () => {
                            const interactions: any = await contractRef.current.getUserData()
                            console.log(
                              `interaction count for address ${ContractABI.networks[4].address}:`,
                              interactions.count.toNumber()
                            )
                          }}
                        >
                          getUserData
                        </Button>
                        <Button ml='12px' pt='6px' pb='6px' pl='10px' pr='10px'
                          onClick={async () => {
                            const interactions: any = await contractRef.current.getAllInteractions()
                            const mapped = interactions.map((inter: any) => {
                              return {
                                id: inter.id.toNumber(),
                                count: inter.count.toNumber(),
                                address: inter.address_
                              };
                            })
                            console.log(mapped);
                          }}
                        >
                          getAllInteractions (all addresses)
                        </Button>
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
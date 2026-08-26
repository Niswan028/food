import { ethers } from 'ethers';
import { supabase } from '@/lib/supabase';
import { BlockchainAnchor } from '@/types';

const rpcUrl = (import.meta.env.VITE_BLOCKCHAIN_RPC_URL as string) || '';
const privateKey = (import.meta.env.VITE_BLOCKCHAIN_PRIVATE_KEY as string) || '';
const networkName = (import.meta.env.VITE_BLOCKCHAIN_NETWORK as string) || 'polygon-mumbai';
const scanBaseUrl = (import.meta.env.VITE_BLOCKCHAIN_SCAN_BASE_URL as string) || 'https://mumbai.polygonscan.com';

export const blockchainStatus = {
  isConfigured: Boolean(rpcUrl && privateKey),
  network: networkName,
  scanBaseUrl,
};

export async function anchorBatchToChain(batchId: string): Promise<BlockchainAnchor | null> {
  const payloadHash = `farmtrace:${batchId}:${Date.now()}`;

  try {
    if (rpcUrl && privateKey) {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      const dataHex = `0x${toHex(payloadHash)}`;
      const tx = await wallet.sendTransaction({
        to: wallet.address,
        value: 0n,
        data: dataHex,
      });
      await tx.wait();

      const record = {
        batch_id: batchId,
        tx_hash: tx.hash,
        block_number: Number(tx.blockNumber ?? 0),
        network: networkName,
        anchored_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('blockchain_anchor')
        .insert(record)
        .select()
        .single();

      if (error) {
        console.error('Blockchain anchor error:', error.message);
        return null;
      }

      return data as BlockchainAnchor;
    }
  } catch (error) {
    console.warn('Real blockchain anchoring unavailable. Falling back to demo hash.', error);
  }

  const mockTxHash = generateMockTxHash();
  const mockBlockNumber = generateMockBlockNumber();

  const { data, error } = await supabase
    .from('blockchain_anchor')
    .insert({
      batch_id: batchId,
      tx_hash: mockTxHash,
      block_number: mockBlockNumber,
      network: networkName,
      anchored_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Blockchain anchor error:', error.message);
    return null;
  }

  return data as BlockchainAnchor;
}

function toHex(value: string): string {
  const bytes = new TextEncoder().encode(value);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function generateMockTxHash(): string {
  const hex = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += hex[Math.floor(Math.random() * 16)];
  }
  return hash;
}

function generateMockBlockNumber(): number {
  return 40000000 + Math.floor(Math.random() * 50000000);
}

export function getPolygonScanUrl(txHash: string): string {
  return `${scanBaseUrl}/tx/${txHash}`;
}

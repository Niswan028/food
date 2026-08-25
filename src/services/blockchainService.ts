import { supabase } from '@/lib/supabase';
import { BlockchainAnchor } from '@/types';

// TODO: replace mock anchor with real Solidity contract call on Polygon
// This function currently generates a mock blockchain anchor record.
// To go live: replace the mock tx_hash/block_number generation with an actual
// web3 contract call that anchors the batch hash on Polygon, then store the real
// tx_hash and block_number returned by the transaction.
export async function anchorBatchToChain(batchId: string): Promise<BlockchainAnchor | null> {
  const mockTxHash = generateMockTxHash();
  const mockBlockNumber = generateMockBlockNumber();

  const { data, error } = await supabase
    .from('blockchain_anchor')
    .insert({
      batch_id: batchId,
      tx_hash: mockTxHash,
      block_number: mockBlockNumber,
      network: 'polygon-mumbai',
    })
    .select()
    .single();

  if (error) {
    console.error('Blockchain anchor error:', error.message);
    return null;
  }

  return data as BlockchainAnchor;
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
  return `https://mumbai.polygonscan.com/tx/${txHash}`;
}

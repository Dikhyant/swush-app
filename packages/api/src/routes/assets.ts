import express, { Request, Response } from 'express';
import { z } from 'zod';
import { getAssets } from '../../services';
import type { Asset } from '@swush/core';
import { serializeKey } from '../../services/assets/utils';

const router = express.Router();

// GET /api/v1/assets
router.get('/', async (req: Request, res: Response) => {
  try {
    const assets: Map<string, Asset> = await getAssets();
    
    // Convert Map to array and serialize using serializeKey
    const assetsArray = Array.from(assets.entries()).map(([id, asset]) => ({
      id,
      ...JSON.parse(serializeKey(asset))  // Use existing serializer
    }));

    res.json({
      status: 'success',
      data: assetsArray
    });
  } catch (error: unknown) {
    console.error('Error fetching assets:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid query parameters',
        errors: error.errors
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch assets'
    });
  }
});

export const assetsRouter = router; 

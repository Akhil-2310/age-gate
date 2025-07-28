import { NextRequest, NextResponse } from "next/server";
import { 
  SelfBackendVerifier, 
  DefaultConfigStore,
  AllIds, VerificationConfig
} from '@selfxyz/core';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { 
      attestationId, 
      proof, 
      publicSignals, 
      pubSignals, 
      userContextData 
    } = body;
    
    // Handle both parameter naming conventions
    const signals = publicSignals || pubSignals;

    if (!proof || !signals || !attestationId || !userContextData) {
      return NextResponse.json({
        status: 'error',
        result: false,
        reason: "Proof, publicSignals, attestationId and userContextData are required",
        error_code: "INVALID_INPUTS"
      }, { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    const disclosures_config: VerificationConfig = {
      excludedCountries: [],
      ofac: false,
      minimumAge: 18,
    };

    const configStore = new DefaultConfigStore(disclosures_config);

    const selfBackendVerifier = new SelfBackendVerifier(
      "agegate",
      "https://age-gate-nine.vercel.app/api/verify",
      true, // dev mode
      AllIds,
      configStore,
      "uuid", // user ID type as string
    );

    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      signals,
      userContextData
    );
    
    if (!result.isValidDetails.isValid) {
      return NextResponse.json({
        status: "error",
        result: false,
        reason: "Verification failed",
        error_code: "VERIFICATION_FAILED",
        details: result.isValidDetails,
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    if (result.isValidDetails.isValid) {
      return NextResponse.json({
        status: "success",
        result: result.isValidDetails.isValid,
        credentialSubject: result.discloseOutput,
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } else {
      return NextResponse.json({
        status: "error",
        result: result.isValidDetails.isValid,
        reason: "Verification failed",
        error_code: "VERIFICATION_FAILED",
        details: result,
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }
  } catch (error) {
    console.error("Error verifying proof:", error);
    return NextResponse.json({
      status: "error",
      result: false,
      reason: "Internal Error",
      error_code: "INTERNAL_ERROR"
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}

export type RegistrationApiResponse = {
  success: true;
  activationKey: string;
  emailSent: boolean;
  registrationId: string;
};

export type RegistrationApiError = {
  error: string;
};

async function postRegistration<TBody extends object>(
  endpoint: string,
  body: TBody
): Promise<RegistrationApiResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Registration failed (${response.status})`);
  }

  return data as RegistrationApiResponse;
}

export function submitWaitlistRegistration(body: {
  firstName: string;
  emailAddress: string;
  country: string;
  experienceLevel: string;
  uid?: string;
}) {
  return postRegistration('/api/registrations/waitlist', body);
}

export function submitIdentityPreregistration(body: {
  emailAddress: string;
  tierId: string;
  displayName?: string;
  uid?: string;
}) {
  return postRegistration('/api/registrations/identity', body);
}

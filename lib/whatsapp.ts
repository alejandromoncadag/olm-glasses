export const BUSINESS_WHATSAPP_NUMBER = "+52 1 56 2086 8654";

export function createWhatsAppLink(
  message: string,
  phoneNumber = BUSINESS_WHATSAPP_NUMBER
) {
  const normalizedPhoneNumber = phoneNumber.replace(/\D/g, "");
  const normalizedMessage = message.trim();

  return `https://wa.me/${normalizedPhoneNumber}?text=${encodeURIComponent(
    normalizedMessage
  )}`;
}

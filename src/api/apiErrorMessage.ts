import axios from 'axios';

type ApiErrorBody = {
  message?: string;
  fieldErrors?: Array<{ field?: string; message?: string }>;
};

export function apiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return fallback;
  if (!error.response) {
    return 'Sunucuya ulaşılamadı. Backend bağlantısını kontrol edip yeniden deneyin.';
  }

  const fieldMessages = error.response.data?.fieldErrors
    ?.map((item) => formatFieldError(item.field, item.message))
    .filter((message): message is string => Boolean(message));

  if (fieldMessages?.length) return fieldMessages.join(' ');
  if (error.response.data?.message) return error.response.data.message;
  if (error.response.status === 401) return 'Oturumunuz sona erdi. Lütfen yeniden giriş yapın.';
  if (error.response.status === 403) return 'Bu işlemi yapmaya yetkiniz bulunmuyor.';
  if (error.response.status >= 500) return 'Sunucuda bir hata oluştu. Lütfen yeniden deneyin.';
  return fallback;
}

function formatFieldError(field?: string, message?: string) {
  const fieldName = readableFieldName(field);
  const translated = message
    ?.replace('must not be blank', 'boş bırakılamaz')
    .replace('must not be null', 'zorunludur')
    .replace('must be greater than or equal to', 'en az')
    .replace('must be less than or equal to', 'en fazla')
    .replace(/must match .+/, 'beklenen biçime uygun olmalıdır')
    .replace('must be a well-formed email address', 'geçerli bir e-posta adresi olmalıdır');
  return translated ? `${fieldName}: ${translated}` : `${fieldName} geçersiz.`;
}

function readableFieldName(field?: string) {
  if (!field) return 'Alan';
  const nestedField = field.match(/^sections\[(\d+)]\.fields\[(\d+)]\.(.+)$/);
  if (nestedField) {
    const [, sectionIndex, fieldIndex, property] = nestedField;
    const propertyNames: Record<string, string> = {
      key: 'teknik tanım',
      label: 'soru',
      type: 'soru türü',
      options: 'seçenekler',
      requirementId: 'belge',
    };
    return `${Number(sectionIndex) + 1}. bölüm, ${Number(fieldIndex) + 1}. soru, ${propertyNames[property] ?? property}`;
  }
  return field.replaceAll(/([A-Z])/g, ' $1').toLocaleLowerCase('tr-TR');
}

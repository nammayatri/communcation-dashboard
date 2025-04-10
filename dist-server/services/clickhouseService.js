import { createClient } from '@clickhouse/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });
// Create Clickhouse client configuration with URL format
const clickhouseConfig = {
    url: 'http://10.6.155.14:8123',
    username: 'juspay_data_view',
    password: 'i8U;&%v1l-[DK.FA',
    database: 'atlas_driver_offer_bpp',
    protocol: 'native' // Use native protocol instead of HTTP
};
// Create Clickhouse client
const client = createClient(clickhouseConfig);
export async function executeQuery(query, params) {
    try {
        const result = await client.query({
            query,
            format: 'JSONEachRow',
            query_params: params
        });
        return await result.json();
    }
    catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}
export async function downloadData(city, variant = 'ALL') {
    const query = `
        SELECT 
            p.id as person_id,
            p.first_name,
            p.last_name,
            p.mobile_number,
            p.email,
            p.created_at,
            p.updated_at,
            p.city,
            p.variant,
            p.status,
            p.is_active,
            p.is_deleted,
            p.is_verified,
            p.is_blocked,
            p.is_suspended,
            p.is_blacklisted,
            p.is_whitelisted,
            p.is_premium,
            p.is_vip,
            p.is_test,
            p.is_demo,
            p.is_trial,
            p.is_paid,
            p.is_free,
            p.is_basic,
            p.is_pro,
            p.is_enterprise,
            p.is_custom,
            p.is_legacy,
            p.is_new,
            p.is_old,
            p.is_current,
            p.is_future,
            p.is_past,
            p.is_present,
            p.is_temporary,
            p.is_permanent,
            p.is_default,
            p.is_special,
            p.is_limited,
            p.is_unlimited,
            p.is_restricted,
            p.is_unrestricted,
            p.is_public,
            p.is_private,
            p.is_hidden,
            p.is_visible,
            p.is_enabled,
            p.is_disabled,
            p.is_on,
            p.is_off,
            p.is_true,
            p.is_false,
            p.is_null,
            p.is_empty,
            p.is_full,
            p.is_partial,
            p.is_complete,
            p.is_incomplete,
            p.is_valid,
            p.is_invalid,
            p.is_correct,
            p.is_incorrect,
            p.is_right,
            p.is_wrong,
            p.is_good,
            p.is_bad,
            p.is_ok,
            p.is_not_ok,
            p.is_yes,
            p.is_no,
            p.is_maybe,
            p.is_unknown,
            p.is_undefined
        FROM person p
        WHERE p.city = {city:String}
        AND p.variant = {variant:String}
        AND p.is_deleted = 0
        AND p.is_active = 1
        AND p.is_verified = 1
        AND p.is_blocked = 0
        AND p.is_suspended = 0
        AND p.is_blacklisted = 0
        AND p.is_whitelisted = 0
        AND p.is_premium = 0
        AND p.is_vip = 0
        AND p.is_test = 0
        AND p.is_demo = 0
        AND p.is_trial = 0
        AND p.is_paid = 0
        AND p.is_free = 1
        AND p.is_basic = 1
        AND p.is_pro = 0
        AND p.is_enterprise = 0
        AND p.is_custom = 0
        AND p.is_legacy = 0
        AND p.is_new = 1
        AND p.is_old = 0
        AND p.is_current = 1
        AND p.is_future = 0
        AND p.is_past = 0
        AND p.is_present = 1
        AND p.is_temporary = 0
        AND p.is_permanent = 1
        AND p.is_default = 1
        AND p.is_special = 0
        AND p.is_limited = 0
        AND p.is_unlimited = 1
        AND p.is_restricted = 0
        AND p.is_unrestricted = 1
        AND p.is_public = 1
        AND p.is_private = 0
        AND p.is_hidden = 0
        AND p.is_visible = 1
        AND p.is_enabled = 1
        AND p.is_disabled = 0
        AND p.is_on = 1
        AND p.is_off = 0
        AND p.is_true = 1
        AND p.is_false = 0
        AND p.is_null = 0
        AND p.is_empty = 0
        AND p.is_full = 1
        AND p.is_partial = 0
        AND p.is_complete = 1
        AND p.is_incomplete = 0
        AND p.is_valid = 1
        AND p.is_invalid = 0
        AND p.is_correct = 1
        AND p.is_incorrect = 0
        AND p.is_right = 1
        AND p.is_wrong = 0
        AND p.is_good = 1
        AND p.is_bad = 0
        AND p.is_ok = 1
        AND p.is_not_ok = 0
        AND p.is_yes = 1
        AND p.is_no = 0
        AND p.is_maybe = 0
        AND p.is_unknown = 0
        AND p.is_undefined = 0
        LIMIT 1000
    `;
    return executeQuery(query, { city, variant });
}

from clickhouse_driver import Client
import clickhouse_connect
import pandas as pd
import sys
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CLICKHOUSE_HOST = '10.6.155.14'
CLICKHOUSE_USER = 'juspay_data_view'
CLICKHOUSE_PASSWORD = 'i8U;&%v1l-[DK.FA'
CLICKHOUSE_PORT = 8123  # Use 8123 for HTTP or 9000 for native TCP

def main():
    # Get city and variant from command line arguments
    if len(sys.argv) < 2:
        logger.error("City parameter is required")
        sys.exit(1)

    city = sys.argv[1]
    variant = sys.argv[2] if len(sys.argv) > 2 else 'ALL'
    output_file = sys.argv[3] if len(sys.argv) > 3 else f"{city}_{variant}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    logger.info(f"Fetching data for city: {city}, variant: {variant}")
    logger.info(f"Output will be saved to: {output_file}")

    try:
        client = clickhouse_connect.get_client(
            host=CLICKHOUSE_HOST,
            port=CLICKHOUSE_PORT,
            username=CLICKHOUSE_USER,
            password=CLICKHOUSE_PASSWORD
        )

        logger.info("Connected to Clickhouse")

        sql_query = f"""
            SELECT 
              `atlas_driver_offer_bpp`.`person`.`id` as `driverId`,
              `atlas_driver_offer_bpp`.`person`.`device_token` as `token`
            FROM `atlas_driver_offer_bpp`.`person` FINAL
            LEFT JOIN `atlas_driver_offer_bpp`.`driver_information` as `Driver Information` FINAL
              ON `atlas_driver_offer_bpp`.`person`.`id` = `Driver Information`.`driver_id`
            LEFT JOIN `atlas_driver_offer_bpp`.`merchant_operating_city` as `Merchant Operating City`
              ON `atlas_driver_offer_bpp`.`person`.`merchant_operating_city_id` = `Merchant Operating City`.`id`
            LEFT JOIN `atlas_driver_offer_bpp`.`vehicle` as `Vehicle` 
              ON `atlas_driver_offer_bpp`.`person`.`id` = `Vehicle`.`driver_id`
            WHERE
              `atlas_driver_offer_bpp`.`person`.`device_token` IS NOT NULL
              AND `atlas_driver_offer_bpp`.`person`.`device_token` <> ''
              AND `Merchant Operating City`.`city` = '{city}'
              AND (
                ('{variant}' = 'ALL' AND `Vehicle`.`variant` IS NOT NULL) 
                OR (
                  `Vehicle`.`variant` IN ('AUTO_RICKSHAW', 'BIKE') AND '{variant}' = `Vehicle`.`variant`
                )
                OR (
                  `Vehicle`.`variant` NOT IN ('AUTO_RICKSHAW', 'BIKE') 
                  AND `Vehicle`.`variant` IS NOT NULL 
                  AND '{variant}' = 'CAB'
                )
              )
        """

        logger.info("Executing query...")
        res = client.query(sql_query)
        logger.info("Query executed successfully")

        # Convert results to a DataFrame
        df = pd.DataFrame(res.result_rows, columns=res.column_names)
        logger.info(f"Retrieved {len(df)} records")

        # Save to CSV
        df.to_csv(output_file, index=False)
        logger.info(f"Data saved to {output_file}")

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
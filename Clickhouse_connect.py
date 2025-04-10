from clickhouse_driver import Client
import clickhouse_connect
import pandas as pd


CLICKHOUSE_HOST = '10.6.155.14'
CLICKHOUSE_USER = 'juspay_data_view'
CLICKHOUSE_PASSWORD = 'i8U;&%v1l-[DK.FA'
CLICKHOUSE_PORT = 8123  # Use 8123 for HTTP or 9000 for native TCP

client = clickhouse_connect.get_client(
	host=CLICKHOUSE_HOST,
	port=CLICKHOUSE_PORT,
	username=CLICKHOUSE_USER,
	password=CLICKHOUSE_PASSWORD
	)


sql_query = """

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
          AND `Merchant Operating City`.`city` = 'Delhi'
          AND (
            ('CAB' = 'ALL' AND `Vehicle`.`variant` IS NOT NULL) 
            OR (
              `Vehicle`.`variant` IN ('AUTO_RICKSHAW', 'BIKE') AND 'CAB' = `Vehicle`.`variant`
            )
            OR (
              `Vehicle`.`variant` NOT IN ('AUTO_RICKSHAW', 'BIKE') 
              AND `Vehicle`.`variant` IS NOT NULL 
              AND 'CAB' = 'CAB'
            )
          )
      
"""

# Execute the query
res = client.query(sql_query)

# Convert results to a DataFrame
df = pd.DataFrame(res.result_rows, columns=res.column_names)

# Print the DataFrame
df.to_csv("output.csv", index=False)
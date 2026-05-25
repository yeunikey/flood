import xarray as xr

path = r"C:\Users\user_pc\models_ETL\models_ETL_new\model_raw_data\LSTM_lumped_Uba\era5land_raw\2025\08\07\era5-land_20250807.nc"

ds = xr.open_dataset(path)

print("=== DATASET INFO ===")
print(ds)

print("\n=== DIMENSIONS ===")
print(ds.dims)

print("\n=== COORDS ===")
print(list(ds.coords))

print("\n=== DATA VARIABLES ===")
print(list(ds.data_vars))

# определить time координату
time_name = None
for cand in ["time", "valid_time", "forecast_time"]:
    if cand in ds.coords or cand in ds.variables:
        time_name = cand
        break

print("\n=== TIME COORD NAME ===")
print(time_name)


print("units:", ds["sd"].attrs.get("units"))
for k in ["long_name","standard_name","GRIB_name","GRIB_shortName","GRIB_units","GRIB_cfName","GRIB_paramId"]:
    if k in ds["sd"].attrs:
        print(k, "=", ds["sd"].attrs[k])

print("sd min/max:", float(ds["sd"].min()), float(ds["sd"].max()))


if time_name:
    print("Time length:", ds.dims.get(time_name))
    print("First time:", ds[time_name].values[0])
    print("Last time :", ds[time_name].values[-1])

ds.close()

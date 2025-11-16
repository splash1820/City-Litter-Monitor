
import sys
import pkgutil

print("PYTHONPATH dirs searched:")
for p in sys.path:
    print("  ", p)

print("\nAll modules named 'utils':")
for m in pkgutil.iter_modules():
    if m.name == "utils":
        print("FOUND:", m)


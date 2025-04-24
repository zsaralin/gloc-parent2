import json

def convert_to_arg_format(input_path, output_path):
    with open(input_path, 'r') as f:
        data = json.load(f)

    labels = []
    label_index = {}
    descriptors = []

    for idx, (key, value) in enumerate(data.items()):
        label = value.get("label", key)
        labels.append(label)
        label_index[label] = [idx]
        descriptors.extend(value.get("descriptors", []))

    arg_format = {
        "labels": labels,
        "labelIndex": label_index,
        "descriptors": descriptors
    }

    with open(output_path, 'w') as f:
        json.dump(arg_format, f, indent=2)

    print(f"Saved to {output_path}")

# Example usage

# Example usage:
convert_to_arg_format("../descriptors/descriptors_arg_new.json", "converted_arg_format.json")

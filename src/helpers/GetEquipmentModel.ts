export function GetEquipmentModel(serial: string): string {
  let model: string = "Outro"; // Default model

  // Check if serial is empty
  if (serial.trim().length === 0) {
    return model;
  }

  // Gertec serial codes
  if (serial.length === 16 && !isNaN(Number(serial))) {
    switch (serial.substring(0, 2)) {
      case "72":
        model = "PINPAD";
        break;
      case "59":
        model = "GPOS 760";
        break;
      case "52":
        model = "GPOS 700";
        break;
    }
  }

  // Gertec serial codes with length 10
  if (serial.length === 10 && !isNaN(Number(serial))) {
    switch (serial.substring(0, 2)) {
      case "17":
        model = "Q92";
        break;
    }
  }

  // Ingenico IWL
  if (serial.length === 15 && isNaN(Number(serial))) {
    if (
      !isNaN(Number(serial.substring(0, 5))) &&
      serial.substring(5, 7) === "WL"
    ) {
      if (!isNaN(Number(serial.substring(7)))) {
        model = "IWL 251";
      }
    }
  }

  // S920
  if (serial.length === 8) {
    if (
      !isNaN(Number(serial.substring(0, 1))) &&
      isNaN(Number(serial.substring(1, 2)))
    ) {
      model = "S920";
    }
  }

  // D195
  if (serial.length === 10 && !isNaN(Number(serial))) {
    if (serial.substring(0, 4) === "1471") {
      model = "D195";
    }
  }

  // Move 2500
  if (serial.length === 24 && !isNaN(Number(serial))) {
    if (serial.substring(5, 7) === "69") {
      model = "MOVE 2500";
    }
  }

  return model;
}

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Printer Information</title>
</head>
<body>
    <h1>Printer Information</h1>

    <table border="1">
        <thead>
            <tr>
                <th>Printer Name</th>
                <th>IP Address</th>
                <th>Port</th>
                <th>Current Datetime</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($printerStatus as $printer)
            <tr>
                <td>{{ $printer['printer_name'] }}</td>
                <td>{{ $printer['ip_address'] }}</td>
                <td>{{ $printer['port'] }}</td>
                <td>{{ $printer['datetime'] }}</td>
                <td>{{ $printer['status'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
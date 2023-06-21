import React from "react";

const TableComponent = ({ tables }) => {
    return (
    <div className="message">
    {tables.map((table, index) => (
        <div className="table" key={index}>
            <table>
                <thead>
                <tr>
                    {table.headers.map((header, headerIndex) => (
                    <th key={headerIndex}>{header}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                    ))}
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        ))}
        </div>
    );
};

export default TableComponent;

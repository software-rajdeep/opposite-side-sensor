import os
import csv
import io
import psycopg2

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
FRONTEND_DIST_DIR = os.path.join(PROJECT_ROOT, "dist")

DB_HOST = "localhost"
DB_NAME = "sensor_db"
DB_USER = "rapl"
DB_PASS = "rapl2026"


def register_download_routes(app, DB_TABLE_FILTERED, DB_TABLE_UNFILTERED, DB_TABLE_THICKNESS):
    from flask import request, jsonify, Response

    @app.route('/download/filtered', methods=['POST'])
    def download_filtered():
        try:
            conn = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
            cur  = conn.cursor()
            cur.execute(f"""
                SELECT id, timestamp, sensor_a, sensor_b, thickness
                FROM {DB_TABLE_FILTERED}
                ORDER BY timestamp ASC
            """)
            rows = cur.fetchall()
            cur.close()
            conn.close()
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["id", "timestamp", "sensor A", "sensor B", "thickness"])
            writer.writerows(rows)
            output.seek(0)
            return Response(
                output.getvalue(),
                mimetype="text/csv",
                headers={"Content-Disposition": "attachment; filename=filtered_distance_data.csv"}
            )
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/download/raw', methods=['POST'])
    def download_raw():
        try:
            conn = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
            cur  = conn.cursor()
            cur.execute(f"""
                SELECT id, timestamp, sensor_a, sensor_b, thickness
                FROM {DB_TABLE_UNFILTERED}
                ORDER BY timestamp ASC
            """)
            rows = cur.fetchall()
            cur.close()
            conn.close()
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["id", "timestamp", "sensor A", "sensor B", "thickness"])
            writer.writerows(rows)
            output.seek(0)
            return Response(
                output.getvalue(),
                mimetype="text/csv",
                headers={"Content-Disposition": "attachment; filename=unfiltered_distance_data.csv"}
            )
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/download/thickness', methods=['GET'])
    def download_thickness():
        """Export opposite_thickness_readings table as CSV."""
        try:
            conn = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
            cur  = conn.cursor()
            cur.execute(f"""
                SELECT id, timestamp, sensor_a, sensor_b, thickness
                FROM {DB_TABLE_THICKNESS}
                ORDER BY timestamp ASC
            """)
            rows = cur.fetchall()
            cur.close()
            conn.close()
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["#", "Timestamp", "Sensor A (mm)", "Sensor B (mm)", "Thickness (mm)"])
            writer.writerows(rows)
            output.seek(0)
            return Response(
                output.getvalue(),
                mimetype="text/csv",
                headers={"Content-Disposition": "attachment; filename=thickness_data.csv"}
            )
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/db/status', methods=['GET'])
    def db_status():
        try:
            conn = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
            cur  = conn.cursor()
            cur.execute(f"SELECT COUNT(*) FROM {DB_TABLE_FILTERED}")
            filtered_count = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {DB_TABLE_UNFILTERED}")
            unfiltered_count = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {DB_TABLE_THICKNESS}")
            thickness_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM users")
            users_count = cur.fetchone()[0]
            cur.close()
            conn.close()
            return jsonify({
                "filtered":   filtered_count,
                "unfiltered": unfiltered_count,
                "thickness":  thickness_count,
                "users":      users_count,
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
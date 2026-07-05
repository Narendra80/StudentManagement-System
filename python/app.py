import os
import sys
from flask import Flask, render_template, request, jsonify, send_from_directory

# Ensure local module imports work regardless of execution directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from student import (
    add_student, view_students, search_student,
    update_student, delete_student, get_statistics, get_student_by_id
)

# Root directory is parent of python/ folder where HTML/CSS/JS reside
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

app = Flask(
    __name__,
    template_folder=ROOT_DIR,
    static_folder=ROOT_DIR,
    static_url_path=''
)

# ==========================================
# Frontend Page Routes
# ==========================================
@app.route('/')
@app.route('/index.html')
def home():
    return render_template('index.html')

@app.route('/<page_name>.html')
def render_page(page_name):
    try:
        return render_template(f'{page_name}.html')
    except Exception:
        return render_template('index.html'), 404

# ==========================================
# REST API Endpoints
# ==========================================
@app.route('/api/students', methods=['GET'])
def api_get_students():
    """Returns all student records."""
    students = view_students()
    return jsonify({"success": True, "data": students, "count": len(students)}), 200

@app.route('/api/students/<student_id>', methods=['GET'])
def api_get_student(student_id):
    """Returns a single student by student_id."""
    student = get_student_by_id(student_id)
    if student:
        return jsonify({"success": True, "data": student}), 200
    return jsonify({"success": False, "error": f"Student ID '{student_id}' not found."}), 404

@app.route('/api/students/search', methods=['GET'])
def api_search_students():
    """Searches students by ID, Roll Number, Name, Branch, or Email."""
    query = request.args.get('q', '').strip()
    results = search_student(query)
    return jsonify({"success": True, "data": results, "count": len(results)}), 200

@app.route('/api/students', methods=['POST'])
def api_add_student():
    """Adds a new student record after validation."""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON payload provided."}), 400
    
    res = add_student(data)
    if res.get("success"):
        return jsonify(res), 201
    else:
        return jsonify(res), 400

@app.route('/api/students/<student_id>', methods=['PUT'])
def api_update_student(student_id):
    """Updates an existing student record."""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON payload provided."}), 400
    
    res = update_student(student_id, data)
    if res.get("success"):
        return jsonify(res), 200
    else:
        return jsonify(res), 400

@app.route('/api/students/<student_id>', methods=['DELETE'])
def api_delete_student(student_id):
    """Deletes a student record by student_id."""
    res = delete_student(student_id)
    if res.get("success"):
        return jsonify(res), 200
    else:
        return jsonify(res), 404

@app.route('/api/stats', methods=['GET'])
def api_get_stats():
    """Returns summary statistics for dashboard cards."""
    stats = get_statistics()
    return jsonify({"success": True, "data": stats}), 200

if __name__ == '__main__':
    print("===========================================================")
    print("      STUDENT MANAGEMENT SYSTEM - BACKEND SERVER")
    print("===========================================================")
    print(f"Serving frontend from: {ROOT_DIR}")
    print("Open http://localhost:5000 in your browser.")
    print("===========================================================")
    app.run(host='0.0.0.0', port=5000, debug=True)

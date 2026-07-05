import re
import sys
import os

# Ensure local module imports work regardless of execution directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import load_data, save_data

def validate_student_data(data, is_update=False, existing_id=None):
    """
    Validates student data according to required rules:
    - Required fields cannot be blank
    - Student ID cannot be empty and must be unique
    - Name should contain only letters and spaces
    - Roll Number must be unique
    - Email format validation
    - Mobile Number should contain exactly 10 digits
    """
    required_fields = [
        'student_id', 'name', 'roll_number', 'branch',
        'year', 'section', 'gender', 'dob', 'email', 'mobile', 'address'
    ]
    
    for field in required_fields:
        val = str(data.get(field, '')).strip()
        if not val:
            return False, f"Field '{field.replace('_', ' ').title()}' cannot be empty."
        data[field] = val

    # Validate Name (letters and spaces only)
    if not re.match(r'^[a-zA-Z\s.-]+$', data['name']):
        return False, "Name should contain only letters, spaces, dots, or hyphens."

    # Validate Email format
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_regex, data['email']):
        return False, "Invalid email address format."

    # Validate Mobile Number (10 digits)
    if not re.match(r'^\d{10}$', data['mobile']):
        return False, "Mobile number must contain exactly 10 digits."

    # Check uniqueness of Student ID and Roll Number
    students = load_data()
    for student in students:
        if is_update and student.get('student_id') == existing_id:
            continue
        if student.get('student_id') == data['student_id']:
            return False, f"Student ID '{data['student_id']}' already exists."
        if student.get('roll_number').lower() == data['roll_number'].lower():
            return False, f"Roll Number '{data['roll_number']}' already exists."

    return True, "Valid"

def add_student(data):
    """
    Adds a new student record after validation.
    """
    is_valid, message = validate_student_data(data)
    if not is_valid:
        return {"success": False, "error": message}

    students = load_data()
    students.append(data)
    if save_data(students):
        return {"success": True, "message": "Student record added successfully!", "data": data}
    else:
        return {"success": False, "error": "Failed to save data to file."}

def view_students():
    """
    Returns all student records.
    """
    return load_data()

def get_student_by_id(student_id):
    """
    Returns a single student record by student_id.
    """
    students = load_data()
    for s in students:
        if s.get('student_id') == student_id:
            return s
    return None

def search_student(query):
    """
    Searches students matching student_id, roll_number, or name (case-insensitive).
    """
    if not query:
        return view_students()
    
    q = query.lower().strip()
    students = load_data()
    results = []
    for s in students:
        if (q in str(s.get('student_id', '')).lower() or
            q in str(s.get('roll_number', '')).lower() or
            q in str(s.get('name', '')).lower() or
            q in str(s.get('branch', '')).lower() or
            q in str(s.get('email', '')).lower()):
            results.append(s)
    return results

def update_student(student_id, updated_data):
    """
    Updates an existing student record.
    """
    students = load_data()
    index_to_update = -1
    for i, s in enumerate(students):
        if s.get('student_id') == student_id:
            index_to_update = i
            break

    if index_to_update == -1:
        return {"success": False, "error": f"Student ID '{student_id}' not found."}

    # Maintain original student_id if not provided in updated_data
    updated_data['student_id'] = student_id

    is_valid, message = validate_student_data(updated_data, is_update=True, existing_id=student_id)
    if not is_valid:
        return {"success": False, "error": message}

    students[index_to_update] = updated_data
    if save_data(students):
        return {"success": True, "message": "Student record updated successfully!", "data": updated_data}
    else:
        return {"success": False, "error": "Failed to save updated data."}

def delete_student(student_id):
    """
    Deletes a student record by student_id.
    """
    students = load_data()
    initial_length = len(students)
    students = [s for s in students if s.get('student_id') != student_id]

    if len(students) == initial_length:
        return {"success": False, "error": f"Student ID '{student_id}' not found."}

    if save_data(students):
        return {"success": True, "message": f"Student ID '{student_id}' deleted successfully."}
    else:
        return {"success": False, "error": "Failed to delete student record."}

def get_statistics():
    """
    Calculates summary statistics for dashboard cards.
    """
    students = load_data()
    total = len(students)
    
    branches = {}
    years = {}
    genders = {}
    
    for s in students:
        b = s.get('branch', 'Other')
        branches[b] = branches.get(b, 0) + 1
        
        y = s.get('year', 'Other')
        years[y] = years.get(y, 0) + 1
        
        g = s.get('gender', 'Other')
        genders[g] = genders.get(g, 0) + 1

    return {
        "total_students": total,
        "branches": branches,
        "years": years,
        "genders": genders
    }
